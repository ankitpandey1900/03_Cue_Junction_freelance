import { Customer, Prisma } from "@prisma/client"
import { CustomerFormValues } from "../schemas/customer.schema"
import prisma from "@/lib/prisma"

export async function getCustomers(): Promise<Customer[]> {
  const customers = await prisma.customer.findMany({
    include: {
      invoices: {
        include: {
          payments: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  for (const customer of customers) {
    const actualSpend = customer.invoices.reduce((sum, inv) => {
      return sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0)
    }, 0)

    if (customer.totalSpend !== actualSpend) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { totalSpend: actualSpend }
      })
      customer.totalSpend = actualSpend
    }
  }

  return customers
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      invoices: {
        include: {
          payments: true
        }
      }
    }
  })

  if (!customer) return null

  const actualSpend = customer.invoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0)
  }, 0)

  if (customer.totalSpend !== actualSpend) {
    return await prisma.customer.update({
      where: { id },
      data: { totalSpend: actualSpend }
    })
  }

  return customer
}

export type CustomerProfile = Prisma.CustomerGetPayload<{
  include: {
    invoices: {
      include: {
        payments: true
        session: {
          include: {
            table: true
          }
        }
      }
    }
    sessions: {
      include: {
        table: {
          include: {
            tableType: true
          }
        }
        invoice: true
        orders: {
          include: {
            orderItems: true
          }
        }
      }
    }
    orders: {
      include: {
        orderItems: true
        session: {
          include: {
            table: true
          }
        }
      }
    }
  }
}>

export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      invoices: {
        include: {
          payments: true,
          session: {
            include: {
              table: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      sessions: {
        include: {
          table: {
            include: {
              tableType: true,
            },
          },
          invoice: true,
          orders: {
            include: {
              orderItems: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
      },
      orders: {
        include: {
          orderItems: true,
          session: {
            include: {
              table: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!customer) return null

  const actualSpend = customer.invoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
  }, 0)

  if (customer.totalSpend !== actualSpend) {
    return await prisma.customer.update({
      where: { id },
      data: { totalSpend: actualSpend },
      include: {
        invoices: {
          include: {
            payments: true,
            session: {
              include: {
                table: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        sessions: {
          include: {
            table: {
              include: {
                tableType: true,
              },
            },
            invoice: true,
            orders: {
              include: {
                orderItems: true,
              },
            },
          },
          orderBy: { startTime: "desc" },
        },
        orders: {
          include: {
            orderItems: true,
            session: {
              include: {
                table: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  }

  return customer
}

export async function createCustomer(data: CustomerFormValues): Promise<Customer> {
  // Ensure email is null if empty string
  const email = data.email === "" ? null : data.email

  return await prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: email,
    },
  })
}

export async function updateCustomer(id: string, data: CustomerFormValues): Promise<Customer> {
  const email = data.email === "" ? null : data.email

  return await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      email: email,
    },
  })
}

export async function checkPhoneExists(phone: string, excludeId?: string): Promise<boolean> {
  const customer = await prisma.customer.findFirst({
    where: {
      phone,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })
  return !!customer
}
