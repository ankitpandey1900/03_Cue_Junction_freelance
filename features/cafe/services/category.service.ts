import { MenuCategory } from "@prisma/client"
import { CategoryFormValues } from "../schemas/category.schema"
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

export async function getCategories(): Promise<MenuCategory[]> {
  return await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  })
}

export async function getAllCategories(): Promise<MenuCategory[]> {
  return await prisma.menuCategory.findMany({
    orderBy: { displayOrder: 'asc' }
  })
}

export async function getCategoryById(id: string): Promise<MenuCategory | null> {
  return await prisma.menuCategory.findUnique({
    where: { id }
  })
}

export async function createCategory(data: CategoryFormValues): Promise<MenuCategory> {
  const slug = slugify(data.name)
  
  // Check if slug is unique
  const existing = await prisma.menuCategory.findUnique({ where: { slug } })
  if (existing) {
    throw new Error(`Category with name "${data.name}" already exists (slug duplicate)`)
  }

  return await prisma.menuCategory.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    }
  })
}

export async function updateCategory(id: string, data: CategoryFormValues): Promise<MenuCategory> {
  const slug = slugify(data.name)

  // Check if slug is unique (excluding current category)
  const existing = await prisma.menuCategory.findUnique({ where: { slug } })
  if (existing && existing.id !== id) {
    throw new Error(`Another category with name "${data.name}" already exists`)
  }

  return await prisma.menuCategory.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    }
  })
}

export async function deleteCategory(id: string): Promise<MenuCategory> {
  // Check if any menu items are linked to this category
  const itemCount = await prisma.menuItem.count({
    where: { categoryId: id }
  })

  if (itemCount > 0) {
    throw new Error("Cannot delete category because it contains active menu items. Disable it or move the items first.")
  }

  return await prisma.menuCategory.delete({
    where: { id }
  })
}
