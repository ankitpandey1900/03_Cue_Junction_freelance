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

export async function createMenuItem(data: MenuItemFormValues): Promise<MenuItem> {
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

  return await prisma.menuItem.create({
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
}

export async function updateMenuItem(id: string, data: MenuItemFormValues): Promise<MenuItem> {
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

  return await prisma.menuItem.update({
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
}

export async function toggleItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
  return await prisma.menuItem.update({
    where: { id },
    data: { isAvailable }
  })
}

export async function deleteMenuItem(id: string): Promise<MenuItem> {
  // Check if item has been ordered before
  const orderCount = await prisma.customerOrderItem.count({
    where: { menuItemId: id }
  })

  if (orderCount > 0) {
    // If it has order history, soft-delete by setting availability to false
    return await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false }
    })
  }

  return await prisma.menuItem.delete({
    where: { id }
  })
}
