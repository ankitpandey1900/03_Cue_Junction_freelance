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
      grandTotal: true,
      status: true,
      customer: {
        select: { name: true, phone: true }
      },
      session: {
        select: {
          table: {
            select: { name: true }
          }
        }
      },
    },
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
      session: {
        include: {
          table: {
            include: {
              tableType: true
            }
          },
          orders: {
            include: {
              orderItems: true
            }
          }
        }
      }
    }
  })
}

export async function addPayment(invoiceId: string, amount: number, method: string) {
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
      }
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
