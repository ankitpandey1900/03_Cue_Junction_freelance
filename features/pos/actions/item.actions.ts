"use server"

import { revalidatePath } from "next/cache"
import { menuItemSchema, MenuItemFormValues } from "../schemas/item.schema"
import * as itemService from "../services/item.service"
import { formatActionError } from "@/lib/errors"
import { ActionResponse } from "./category.actions"
import { requireAdmin } from "@/lib/action-auth"

export async function createMenuItemAction(data: MenuItemFormValues): Promise<ActionResponse> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  const validated = menuItemSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const item = await itemService.createMenuItem(validated.data)
    revalidatePath("/pos")
    revalidatePath("/pos/manage")
    return {
      success: true,
      message: "Menu item created successfully!",
      data: item,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create menu item"),
    }
  }
}

export async function updateMenuItemAction(id: string, data: MenuItemFormValues): Promise<ActionResponse> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  const validated = menuItemSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const item = await itemService.updateMenuItem(id, validated.data)
    revalidatePath("/pos")
    revalidatePath("/pos/manage")
    return {
      success: true,
      message: "Menu item updated successfully!",
      data: item,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update menu item"),
    }
  }
}

export async function toggleItemAvailabilityAction(id: string, isAvailable: boolean): Promise<ActionResponse> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  try {
    const item = await itemService.toggleItemAvailability(id, isAvailable)
    revalidatePath("/pos")
    return {
      success: true,
      message: `Item is now ${isAvailable ? "available" : "unavailable"}.`,
      data: item,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update item availability"),
    }
  }
}

export async function deleteMenuItemAction(id: string): Promise<ActionResponse> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  try {
    const res = await itemService.deleteMenuItem(id)
    revalidatePath("/pos")
    revalidatePath("/pos/manage")
    
    // Check if it was disabled (soft deleted) or fully deleted
    const wasSoftDeleted = !res.isAvailable
    return {
      success: true,
      message: wasSoftDeleted
        ? "Menu item has historical order logs. It has been disabled (made unavailable) instead of deleted."
        : "Menu item deleted successfully!",
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to delete menu item"),
    }
  }
}
