import { CustomerOrder, Prisma } from "@prisma/client"
import { PlaceOrderValues } from "../schemas/cafe.schema"
import prisma from "@/lib/prisma"

export async function getMenu() {
  return await prisma.menuItem.findMany({
    where: { isAvailable: true, category: { isActive: true } },
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }]
  })
}

export async function placeOrder(data: PlaceOrderValues & { createdBy?: string }): Promise<CustomerOrder> {
  return await prisma.$transaction(async (tx) => {
    let orderSubtotal = 0
    const orderItemsToCreate: Prisma.CustomerOrderItemCreateWithoutOrderInput[] = []
    let customerId = data.customerId || null

    if (!customerId && data.sessionId) {
      const session = await tx.session.findUnique({
        where: { id: data.sessionId },
        select: { customerId: true },
      })
      customerId = session?.customerId || null
    }

    for (const item of data.items) {
      const menuItem = await tx.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { category: { select: { name: true } } }
      })
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`)
      if (!menuItem.isAvailable) throw new Error(`Item ${menuItem.name} is currently not available`)

      // Check inventory stock limits
      if (menuItem.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${menuItem.name}". Only ${menuItem.stock} left in inventory.`)
      }

      // Decrement inventory stock quantity
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })

      const subTotal = menuItem.basePrice * item.quantity
      orderSubtotal += subTotal

      orderItemsToCreate.push({
        menuItem: {
          connect: { id: item.menuItemId },
        },
        itemNameSnapshot: menuItem.name,
        categorySnapshot: menuItem.category.name,
        unitPriceSnapshot: menuItem.basePrice,
        quantity: item.quantity,
        totalPrice: subTotal,
      })
    }

    const discount = data.discount ?? 0
    const tax = data.tax ?? 0
    const orderTotal = Math.max(0, orderSubtotal - discount + tax)

    // Create CustomerOrder
    const order = await tx.customerOrder.create({
      data: {
        sessionId: data.sessionId || null,
        customerId,
        status: data.sessionId ? "PENDING" : "SERVED", // Standalone orders are served/completed immediately
        subtotal: orderSubtotal,
        discount,
        tax,
        total: orderTotal,
        notes: data.notes || null,
        createdBy: data.createdBy || null,
        orderItems: {
          create: orderItemsToCreate,
        },
      },
      include: {
        orderItems: true,
      },
    })

    // If it's a completely anonymous walk-in order (no session, no customer),
    // automatically generate an UNPAID invoice for it so it can be billed.
    if (!data.sessionId && !customerId) {
      await tx.invoice.create({
        data: {
          cafeTotal: orderTotal,
          sessionTotal: 0,
          taxAmount: tax,
          discountAmount: discount,
          grandTotal: orderTotal,
          status: "UNPAID",
          orders: {
            connect: { id: order.id }
          }
        }
      })
    }

    return order
  })
}

export async function updateOrderStatus(orderId: string, status: string): Promise<CustomerOrder> {
  return await prisma.customerOrder.update({
    where: { id: orderId },
    data: { status }
  })
}
