import { Session } from "@prisma/client"
import { StartSessionFormValues } from "../schemas/session.schema"
import prisma from "@/lib/prisma"
import { roundMoney } from "@/lib/formatters"

export async function getActiveSessions() {
  return await prisma.session.findMany({
    where: {
      status: { in: ["ACTIVE", "PAUSED"] }
    },
    include: {
      table: {
        include: {
          tableType: true
        }
      },
      customer: true,
      orders: {
        include: {
          orderItems: true
        }
      }
    },
    orderBy: {
      startTime: 'desc'
    }
  })
}

export async function startSession(data: StartSessionFormValues): Promise<Session> {
  return await prisma.$transaction(async (tx) => {
    // Check if table is available
    const table = await tx.table.findUnique({ where: { id: data.tableId } })
    if (!table || table.status !== "AVAILABLE") {
      throw new Error("Table is not available")
    }

    // Update table status
    await tx.table.update({
      where: { id: data.tableId },
      data: { status: "OCCUPIED" }
    })

    // Create session
    const session = await tx.session.create({
      data: {
        tableId: data.tableId,
        customerId: data.customerId ?? null,
        bookingId: data.bookingId ?? null,
        extraCharges: data.extraCharges || 0,
        startTime: new Date(),
        status: "ACTIVE",
      }
    })

    if (data.bookingId) {
      await tx.booking.update({
        where: { id: data.bookingId },
        data: { status: "COMPLETED" }
      })
    }

    return session
  })
}

export async function endSession(sessionId: string): Promise<{ session: Session }> {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: sessionId },
      include: { table: true }
    })

    if (!session || session.status === "COMPLETED") {
      throw new Error("Session not found or already completed")
    }

    const endTime = new Date()

    // Update session
    const updatedSession = await tx.session.update({
      where: { id: sessionId },
      data: {
        endTime,
        status: "COMPLETED",
      }
    })

    // Free the table
    await tx.table.update({
      where: { id: session.tableId },
      data: { status: "AVAILABLE" }
    })

    return { session: updatedSession }
  })
}

export async function switchTable(sessionId: string, newTableId: string, extraCharges: number = 0): Promise<Session> {
  return await prisma.$transaction(async (tx) => {
    const currentSession = await tx.session.findUnique({
      where: { id: sessionId },
    })

    if (!currentSession || currentSession.status === "COMPLETED") {
      throw new Error("Cannot switch table for a completed session")
    }

    if (!currentSession.customerId) {
      throw new Error("Only registered customers can switch tables")
    }

    const newTable = await tx.table.findUnique({ where: { id: newTableId } })
    if (!newTable || newTable.status !== "AVAILABLE") {
      throw new Error("Target table is not available")
    }

    // End current session
    await tx.session.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        status: "COMPLETED",
      }
    })
    await tx.table.update({
      where: { id: currentSession.tableId },
      data: { status: "AVAILABLE" }
    })

    // Start new session
    await tx.table.update({
      where: { id: newTableId },
      data: { status: "OCCUPIED" }
    })

    return await tx.session.create({
      data: {
        tableId: newTableId,
        customerId: currentSession.customerId,
        extraCharges: extraCharges,
        startTime: new Date(),
        status: "ACTIVE",
      }
    })
  })
}

export async function pauseSession(sessionId: string): Promise<Session> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  })

  if (!session || session.status !== "ACTIVE") {
    throw new Error("Only active sessions can be paused")
  }

  return await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: "PAUSED",
      lastPausedAt: new Date(),
    }
  })
}

export async function resumeSession(sessionId: string): Promise<Session> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  })

  if (!session || session.status !== "PAUSED" || !session.lastPausedAt) {
    throw new Error("Only paused sessions can be resumed")
  }

  const now = new Date()
  const pauseDurationSeconds = Math.floor((now.getTime() - session.lastPausedAt.getTime()) / 1000)

  return await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: "ACTIVE",
      lastPausedAt: null,
      totalPauseDurationSeconds: session.totalPauseDurationSeconds + pauseDurationSeconds,
    }
  })
}
