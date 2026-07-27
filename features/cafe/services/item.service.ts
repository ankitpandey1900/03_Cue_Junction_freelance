import { MenuItem } from "@prisma/client"
import { MenuItemFormValues } from "../schemas/item.schema"
import prisma from "@/lib/prisma"

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

export type MenuItemWithCategory = MenuItem & {
  category: {
    name: string
  }
}

export async function getMenuItems(): Promise<MenuItemWithCategory[]> {
  return await prisma.menuItem.findMany({
    where: { isAvailable: true, category: { isActive: true } },
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }]
  })
}

export async function getAllMenuItems(): Promise<MenuItemWithCategory[]> {
  return await prisma.menuItem.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }]
  })
}

export async function getItemById(id: string): Promise<MenuItem | null> {
  return await prisma.menuItem.findUnique({
    where: { id }
  })
}

async function logInventoryActivity(
  tx: any,
  userId: string,
  action: string,
  itemId: string,
  metadata: any
) {
  await tx.activityLog.create({
    data: {
      userId,
      action,
      entityType: "MENU_ITEM",
      entityId: itemId,
      metadata: JSON.stringify(metadata)
    }
  })
}

export async function createMenuItem(data: MenuItemFormValues, userId?: string): Promise<MenuItem> {
  const slug = slugify(data.name)
  const sku = data.sku || `SKU-${slug.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  
  // Check for SKU uniqueness
  const existingSku = await prisma.menuItem.findUnique({ where: { sku } })
  if (existingSku) {
    throw new Error(`Item with SKU "${sku}" already exists`)
  }

  // Check for Name uniqueness (slug)
  const existingSlug = await prisma.menuItem.findUnique({ where: { slug } })
  if (existingSlug) {
    throw new Error(`Item with name "${data.name}" already exists`)
  }

  return await prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.create({
      data: {
        categoryId: data.categoryId,
        sku,
        name: data.name,
        slug,
        description: data.description ?? null,
        basePrice: data.basePrice,
        imageUrl: data.imageUrl ?? null,
        preparationTime: data.preparationTime,
        displayOrder: data.displayOrder,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        stock: data.stock ?? 0,
      }
    })

    if (userId) {
      await logInventoryActivity(tx, userId, "ITEM_CREATED", item.id, { 
        itemName: item.name, 
        initialStock: item.stock 
      })
    }

    return item
  })
}

export async function updateMenuItem(id: string, data: MenuItemFormValues, userId?: string): Promise<MenuItem> {
  const slug = slugify(data.name)
  
  // If editing and no SKU is passed, keep original or auto-generate
  const original = await prisma.menuItem.findUnique({ where: { id } })
  const sku = data.sku || original?.sku || `SKU-${slug.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`

  // Check SKU uniqueness excluding self
  const existingSku = await prisma.menuItem.findUnique({ where: { sku } })
  if (existingSku && existingSku.id !== id) {
    throw new Error(`Another item with SKU "${sku}" already exists`)
  }

  // Check Slug uniqueness excluding self
  const existingSlug = await prisma.menuItem.findUnique({ where: { slug } })
  if (existingSlug && existingSlug.id !== id) {
    throw new Error(`Another item with name "${data.name}" already exists`)
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.menuItem.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        sku,
        name: data.name,
        slug,
        description: data.description ?? null,
        basePrice: data.basePrice,
        imageUrl: data.imageUrl ?? null,
        preparationTime: data.preparationTime,
        displayOrder: data.displayOrder,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        stock: data.stock ?? 0,
      }
    })

    if (userId) {
      await logInventoryActivity(tx, userId, "ITEM_UPDATED", id, { 
        itemName: updated.name,
        note: "Item details updated"
      })
    }

    return updated
  })
}

export async function toggleItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
  return await prisma.menuItem.update({
    where: { id },
    data: { isAvailable }
  })
}

export async function deleteMenuItem(id: string, userId?: string): Promise<MenuItem> {
  return await prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.findUnique({ where: { id } })
    if (!item) throw new Error("Item not found")

    // Check if item has been ordered before
    const orderCount = await tx.customerOrderItem.count({
      where: { menuItemId: id }
    })

    let deletedItem
    if (orderCount > 0) {
      // If it has order history, soft-delete by setting availability to false
      deletedItem = await tx.menuItem.update({
        where: { id },
        data: { isAvailable: false }
      })
      if (userId) {
        await logInventoryActivity(tx, userId, "ITEM_DISABLED", id, { 
          itemName: item.name, 
          note: "Item soft-deleted (historical orders exist)" 
        })
      }
    } else {
      deletedItem = await tx.menuItem.delete({
        where: { id }
      })
      if (userId) {
        await logInventoryActivity(tx, userId, "ITEM_DELETED", id, { 
          itemName: item.name 
        })
      }
    }

    return deletedItem
  })
}

export async function updateItemStock(id: string, quantityChange: number, note: string, userId: string): Promise<MenuItem> {
  return await prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.findUnique({ where: { id } })
    if (!item) throw new Error("Item not found")

    const newStock = Math.max(0, item.stock + quantityChange)
    
    const updated = await tx.menuItem.update({
      where: { id },
      data: { stock: newStock }
    })

    await logInventoryActivity(tx, userId, "STOCK_UPDATE", id, {
      itemName: item.name,
      previousStock: item.stock,
      newStock: newStock,
      change: quantityChange,
      note: note
    })

    return updated
  })
}
