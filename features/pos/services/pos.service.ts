import { CustomerOrder } from "@prisma/client"
import { PlaceOrderValues } from "../schemas/pos.schema"
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
    const orderItemsToCreate = []

    for (const item of data.items) {
      const menuItem = await tx.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { category: { select: { name: true } } }
      })
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`)
      if (!menuItem.isAvailable) throw new Error(`Item ${menuItem.name} is currently not available`)

      // Check inventory stock limits
      if ((menuItem as any).stock < item.quantity) {
        throw new Error(`Insufficient stock for "${menuItem.name}". Only ${(menuItem as any).stock} left in inventory.`)
      }

      // Decrement inventory stock quantity
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: {
          stock: {
            decrement: item.quantity
          }
        } as any
      })

      const subTotal = menuItem.basePrice * item.quantity
      orderSubtotal += subTotal

      orderItemsToCreate.push({
        menuItemId: item.menuItemId,
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
    return await tx.customerOrder.create({
      data: {
        sessionId: data.sessionId || null,
        customerId: data.customerId || null,
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
  })
}

export async function updateOrderStatus(orderId: string, status: string): Promise<CustomerOrder> {
  return await prisma.customerOrder.update({
    where: { id: orderId },
    data: { status }
  })
}

