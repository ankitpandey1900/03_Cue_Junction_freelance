import prisma from "@/lib/prisma"

export async function getInvoices() {
  return await prisma.invoice.findMany({
    include: {
      customer: true,
      session: {
        include: {
          table: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getInvoice(id: string) {
  return await prisma.invoice.findUnique({
    where: { id },
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
