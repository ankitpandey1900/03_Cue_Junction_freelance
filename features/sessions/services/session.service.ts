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
    // Atomic update to prevent TOCTOU Race Conditions
    const updateResult = await tx.table.updateMany({
      where: { id: data.tableId, status: "AVAILABLE" },
      data: { status: "OCCUPIED" }
    })

    if (updateResult.count === 0) {
      throw new Error("Table is no longer available")
    }

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

    let additionalPauseSeconds = 0
    if (session.status === "PAUSED" && session.lastPausedAt) {
      additionalPauseSeconds = Math.floor((endTime.getTime() - session.lastPausedAt.getTime()) / 1000)
    }

    // Update session
    const updatedSession = await tx.session.update({
      where: { id: sessionId },
      data: {
        endTime,
        status: "COMPLETED",
        totalPauseDurationSeconds: session.totalPauseDurationSeconds + additionalPauseSeconds,
        lastPausedAt: null
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

export async function switchTable(sessionId: string, newTableId: string, extraCharges: number = 0): Promise<Session & { oldTableName?: string }> {
  return await prisma.$transaction(async (tx) => {
    const currentSession = await tx.session.findUnique({
      where: { id: sessionId },
      include: { table: { include: { tableType: true } } }
    })

    if (!currentSession || currentSession.status === "COMPLETED") {
      throw new Error("Cannot switch table for a completed session")
    }

    const newTable = await tx.table.findUnique({ 
      where: { id: newTableId },
      include: { tableType: true }
    })
    
    if (!newTable || newTable.status !== "AVAILABLE") {
      throw new Error("Target table is not available")
    }

    // 1. Free up old table
    await tx.table.update({
      where: { id: currentSession.tableId },
      data: { status: "AVAILABLE" }
    })

    // 2. Occupy new table
    await tx.table.update({
      where: { id: newTableId },
      data: { status: "OCCUPIED" }
    })

    // 3. Calculate rate adjustment for the past duration
    const end = new Date().getTime()
    let mins = Math.floor((end - currentSession.startTime.getTime()) / 60000)
    mins -= Math.floor(currentSession.totalPauseDurationSeconds / 60)
    if (mins < 1) mins = 1
    
    const oldType = currentSession.table.tableType
    const newType = newTable.tableType
    const hours = mins / 60
    
    // Mathematically offset the past duration cost against the new table's rate
    // so that at checkout, they are billed precisely the correct amounts for both segments.
    const adjustment = (hours * oldType.hourlyRate) - (hours * newType.hourlyRate)

    // 4. Update the existing session
    const updatedSession = await tx.session.update({
      where: { id: sessionId },
      data: {
        tableId: newTableId,
        extraCharges: currentSession.extraCharges + extraCharges + adjustment
      }
    })

    return { ...updatedSession, oldTableName: currentSession.table.name }
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
