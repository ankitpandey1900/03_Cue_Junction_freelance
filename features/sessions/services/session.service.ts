import { Session } from "@prisma/client"
import { StartSessionFormValues } from "../schemas/session.schema"
import prisma from "@/lib/prisma"

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
    return await tx.session.create({
      data: {
        tableId: data.tableId,
        customerId: data.customerId ?? null,
        startTime: new Date(),
        status: "ACTIVE",
      }
    })
  })
}

export async function endSession(sessionId: string): Promise<{ session: Session, totalCost: number, invoiceId: string }> {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ 
      where: { id: sessionId },
      include: { table: { include: { tableType: true } } }
    })
    
    if (!session || session.status === "COMPLETED") {
      throw new Error("Session not found or already completed")
    }

    const endTime = new Date()
    
    // Calculate total duration in minutes
    let totalMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
    
    // Subtract paused duration (convert seconds to minutes)
    const pauseMinutes = Math.floor(session.totalPauseDurationSeconds / 60)
    totalMinutes -= pauseMinutes

    // Make sure we have at least 1 minute if it started
    if (totalMinutes < 1) totalMinutes = 1

    const type = session.table.tableType
    let cost = 0

    if (type.fixedRate != null && type.fixedDuration != null && type.fixedDuration > 0) {
      if (totalMinutes <= type.fixedDuration) {
        cost = type.fixedRate
      } else {
        const extraMinutes = totalMinutes - type.fixedDuration
        const applicableHourlyRate = type.overtimeHourlyRate ?? type.hourlyRate
        cost = type.fixedRate + (extraMinutes / 60) * applicableHourlyRate
      }
    } else {
      const hours = totalMinutes / 60
      cost = hours * type.hourlyRate
    }

    // Apply minimum charge if enforced
    if (cost < type.minimumCharge) {
      cost = type.minimumCharge
    }

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

    // Fetch related Orders that are PENDING for this session
    const orders = await tx.customerOrder.findMany({
      where: { sessionId, status: "PENDING" },
      include: { orderItems: true }
    })

    // Sum up cafe orders
    let cafeTotal = 0
    for (const order of orders) {
      cafeTotal += order.total
    }

    const grandTotal = cost + cafeTotal

    // Generate Invoice
    const invoice = await tx.invoice.create({
      data: {
        sessionId,
        customerId: session.customerId ?? undefined,
        sessionTotal: cost,
        cafeTotal,
        grandTotal,
        status: "UNPAID",
        taxAmount: (cost + cafeTotal) * 0.05, // default 5%
        discountAmount: 0,
      }
    })

    // Mark orders as SERVED (fully completed and billed)
    await tx.customerOrder.updateMany({
      where: { sessionId, status: "PENDING" },
      data: { status: "SERVED" }
    })

    return { session: updatedSession, totalCost: grandTotal, invoiceId: invoice.id }
  })
}
