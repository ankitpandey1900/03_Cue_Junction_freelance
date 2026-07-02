"use server"

import { revalidatePath } from "next/cache"
import { categorySchema, CategoryFormValues } from "../schemas/category.schema"
import * as categoryService from "../services/category.service"
import { formatActionError } from "@/lib/errors"
import { requireAdmin } from "@/lib/action-auth"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function createCategoryAction(data: CategoryFormValues): Promise<ActionResponse> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
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
    revalidatePath("/cafe")
    revalidatePath("/cafe/manage")
    return {
      success: true,
      message: "Category created successfully!",
      data: category,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create category"),
    }
  }
}

export async function updateCategoryAction(id: string, data: CategoryFormValues): Promise<ActionResponse> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
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
    revalidatePath("/cafe")
    revalidatePath("/cafe/manage")
    return {
      success: true,
      message: "Category updated successfully!",
      data: category,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update category"),
    }
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResponse> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  try {
    await categoryService.deleteCategory(id)
    revalidatePath("/cafe")
    revalidatePath("/cafe/manage")
    return {
      success: true,
      message: "Category deleted successfully!",
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to delete category"),
    }
  }
}
