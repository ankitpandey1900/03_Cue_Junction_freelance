import { Customer, Prisma } from "@prisma/client"
import { CustomerFormValues } from "../schemas/customer.schema"
import prisma from "@/lib/prisma"

export async function getCustomers(): Promise<Customer[]> {
  return await prisma.customer.findMany({
    where: { isArchived: false } as any,
    orderBy: {
      updatedAt: 'desc',
    },
  }) as Customer[]
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
  })

  const customerAny = customer as any
  if (!customer || customerAny.isArchived) return null

  return customer as Customer
}

export type CustomerProfile = Prisma.CustomerGetPayload<{
  include: {
    invoices: {
      include: {
        payments: true
        sessions: {
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
        where: { isArchived: false } as any,
        include: {
          payments: true,
          sessions: {
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

  const customerAny = customer as any
  if (!customer || customerAny.isArchived) return null

  return customer as unknown as CustomerProfile
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
      isArchived: false,
    } as any,
  })
  return !!customer
}

export async function archiveCustomer(id: string): Promise<Customer> {
  return await prisma.customer.update({
    where: { id },
    data: { isArchived: true } as any,
  })
}
