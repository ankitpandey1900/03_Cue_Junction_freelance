"use server"

import { revalidatePath } from "next/cache"
import { categorySchema, CategoryFormValues } from "../schemas/category.schema"
import * as categoryService from "../services/category.service"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { formatActionError } from "@/lib/errors"

export type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

async function verifyAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session?.user?.role === "ADMIN"
}

export async function createCategoryAction(data: CategoryFormValues): Promise<ActionResponse> {
  if (!await verifyAdmin()) {
    return { success: false, message: "Unauthorized: Admins only" }
  }

  const validated = categorySchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const category = await categoryService.createCategory(validated.data)
    revalidatePath("/pos")
    revalidatePath("/pos/manage")
    return {
      success: true,
      message: "Category created successfully!",
      data: category,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create category"),
    }
  }
}

export async function updateCategoryAction(id: string, data: CategoryFormValues): Promise<ActionResponse> {
  if (!await verifyAdmin()) {
    return { success: false, message: "Unauthorized: Admins only" }
  }

  const validated = categorySchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const category = await categoryService.updateCategory(id, validated.data)
    revalidatePath("/pos")
    revalidatePath("/pos/manage")
    return {
      success: true,
      message: "Category updated successfully!",
      data: category,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update category"),
    }
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResponse> {
  if (!await verifyAdmin()) {
    return { success: false, message: "Unauthorized: Admins only" }
  }

  try {
    await categoryService.deleteCategory(id)
    revalidatePath("/pos")
    revalidatePath("/pos/manage")
    return {
      success: true,
      message: "Category deleted successfully!",
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to delete category"),
    }
  }
}
