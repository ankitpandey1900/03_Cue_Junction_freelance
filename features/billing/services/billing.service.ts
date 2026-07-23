import prisma from "@/lib/prisma"
import { roundMoney } from "@/lib/formatters"

export type UpdateInvoiceInput = {
  sessionTotal: number
  cafeTotal: number
  discountAmount: number
  status: string
  paymentMethod?: string | null
  notes?: string | null
}

export async function getInvoices() {
  return await prisma.invoice.findMany({
    where: { isArchived: false } as any,
    select: {
      id: true,
      invoiceNumber: true,
      createdAt: true,
      sessionTotal: true,
      cafeTotal: true,
      discountAmount: true,
      taxAmount: true,
      grandTotal: true,
      status: true,
      customer: {
        select: { name: true, phone: true }
      },
      sessions: {
        select: {
          table: {
            select: { name: true }
          }
        }
      },
    } as any,
    orderBy: {
      createdAt: 'desc'
    },
    take: 200,
  })
}

export async function getInvoice(id: string) {
  return await prisma.invoice.findFirst({
    where: { id, isArchived: false } as any,
    include: {
      customer: true,
      payments: true,
      sessions: {
        include: {
          table: {
            include: {
              tableType: true
            }
          }
        }
      },
      orders: {
        include: {
          orderItems: true
        }
      }
    } as any
  })
}

export async function addPayment(invoiceId: string, amount: number, method: string, receivedById?: string) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    })
    if (!invoice) throw new Error("Invoice not found")

    // Create payment
    await tx.payment.create({
      data: {
        invoiceId,
        amount,
        method,
        receivedById,
      } as any
    })

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount
    let status = "PARTIAL"
    if (totalPaid >= invoice.grandTotal - 0.01) {
      status = "PAID"
    }

    // If invoice is linked to a customer, increment customer's total spend
    if (invoice.customerId) {
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalSpend: {
            increment: amount
          }
        }
      })
    }

    // Update invoice status
    return await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paymentMethod: method,
      }
    })
  })
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  return await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status }
  })
}

export async function updateInvoice(invoiceId: string, data: UpdateInvoiceInput) {
  const sessionTotal = roundMoney(Math.max(0, data.sessionTotal))
  const cafeTotal = roundMoney(Math.max(0, data.cafeTotal))
  const discountAmount = roundMoney(data.discountAmount)
  const grandTotal = roundMoney(Math.max(0, sessionTotal + cafeTotal - discountAmount))

  return await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      sessionTotal,
      cafeTotal,
      discountAmount,
      taxAmount: 0,
      grandTotal,
      status: data.status,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
    },
  })
}

export async function deleteInvoice(invoiceId: string) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    })

    if (!invoice) throw new Error("Invoice not found")

    const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { isArchived: true } as any
    })

    if (invoice.customerId && paidAmount > 0) {
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalSpend: {
            decrement: paidAmount,
          },
        },
      })
    }

    return invoice
  })
}

export async function checkoutCustomer(customerId?: string, sessionId?: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Gather all unbilled sessions
    const sessionWhere = customerId 
      ? { customerId, invoiceId: null, status: { in: ["ACTIVE", "COMPLETED", "PAUSED"] } }
      : { id: sessionId, invoiceId: null }

    const sessions = await tx.session.findMany({
      where: sessionWhere as any,
      include: { table: { include: { tableType: true } } }
    })

    // End any still ACTIVE or PAUSED sessions
    for (const session of sessions) {
      if (session.status === "ACTIVE" || session.status === "PAUSED") {
        const endTime = new Date()
        let additionalPauseSeconds = 0
        if (session.status === "PAUSED" && session.lastPausedAt) {
          additionalPauseSeconds = Math.floor((endTime.getTime() - session.lastPausedAt.getTime()) / 1000)
        }
        
        await tx.session.update({
          where: { id: session.id },
          data: { 
            status: "COMPLETED", 
            endTime,
            totalPauseDurationSeconds: session.totalPauseDurationSeconds + additionalPauseSeconds,
            lastPausedAt: null
          }
        })
        await tx.table.update({
          where: { id: session.tableId },
          data: { status: "AVAILABLE" }
        })
        session.endTime = endTime // for local calculation
        session.totalPauseDurationSeconds += additionalPauseSeconds
      }
    }

    // Calculate individual session cost
    let sessionTotal = 0
    for (const session of sessions) {
      const s = session as any
      const type = s.table.tableType
      const end = s.endTime ? s.endTime.getTime() : new Date().getTime()
      let mins = Math.floor((end - s.startTime.getTime()) / 60000)
      mins -= Math.floor(s.totalPauseDurationSeconds / 60)
      if (mins < 1) mins = 1
      
      let cost = 0
      if (type.fixedRate != null && type.fixedDuration != null && type.fixedDuration > 0) {
        if (mins <= type.fixedDuration) {
          cost = type.fixedRate
        } else {
          const extraMinutes = mins - type.fixedDuration
          const applicableHourlyRate = type.overtimeHourlyRate ?? type.hourlyRate
          cost = type.fixedRate + (extraMinutes / 60) * applicableHourlyRate
        }
      } else {
        const hours = mins / 60
        cost = hours * type.hourlyRate
      }
      if (cost < type.minimumCharge) cost = type.minimumCharge
      
      sessionTotal += cost + (s.extraCharges || 0)
    }

    // 2. Gather unbilled orders
    const orderWhere = customerId 
      ? { customerId, invoiceId: null, status: { not: "CANCELLED" } }
      : { sessionId, invoiceId: null, status: { not: "CANCELLED" } }

    const orders = await tx.customerOrder.findMany({
      where: orderWhere as any,
      include: { orderItems: true }
    })

    if (sessions.length === 0 && orders.length === 0) {
      throw new Error("No unbilled sessions or orders found.")
    }

    let cafeTotal = 0
    for (const order of orders) {
      cafeTotal += order.total
    }

    sessionTotal = roundMoney(sessionTotal)
    cafeTotal = roundMoney(cafeTotal)
    const subtotal = roundMoney(sessionTotal + cafeTotal)
    const taxAmount = 0
    const discountAmount = 0
    const grandTotal = roundMoney(subtotal - discountAmount)

    // Generate Invoice
    // 3. Check for any table switches to append to notes
    const logs = await tx.activityLog.findMany({
      where: {
        entityType: "SESSION",
        entityId: { in: sessions.map(s => s.id) },
        action: "TABLE_SWITCHED"
      },
      orderBy: { createdAt: "asc" }
    })
    
    let switchNotes = ""
    if (logs.length > 0) {
      const switches = logs.map(l => {
        try {
          const meta = JSON.parse(l.metadata || "{}")
          return `${meta.oldTable || "Unknown Table"} -> ${meta.newTable || "Unknown Table"}`
        } catch { return "Table Switched" }
      }).join(", ")
      switchNotes = `Table History: ${switches}`
    }

    const invoice = await tx.invoice.create({
      data: {
        customerId: customerId ?? undefined,
        sessionTotal,
        cafeTotal,
        grandTotal,
        status: "UNPAID",
        taxAmount,
        discountAmount,
        notes: switchNotes || undefined,
      }
    })

    // Link sessions
    if (sessions.length > 0) {
      await tx.session.updateMany({
        where: { id: { in: sessions.map(s => s.id) } },
        data: { invoiceId: invoice.id } as any
      })
    }

    // Link orders and mark SERVED
    if (orders.length > 0) {
      await tx.customerOrder.updateMany({
        where: { id: { in: orders.map(o => o.id) } },
        data: { invoiceId: invoice.id, status: "SERVED" } as any
      })
    }

    return invoice
  })
}
