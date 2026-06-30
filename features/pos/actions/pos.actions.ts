"use server"

import { revalidatePath } from "next/cache"
import { placeOrderSchema, PlaceOrderValues } from "../schemas/pos.schema"
import * as posService from "../services/pos.service"

import { formatActionError } from "@/lib/errors"
import { requireSession } from "@/lib/action-auth"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function placeOrderAction(data: PlaceOrderValues): Promise<ActionResponse> {
  let session
  try {
    session = await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  const validated = placeOrderSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const order = await posService.placeOrder({
      ...validated.data,
      createdBy: session.user.id,
    })
    revalidatePath("/pos")
    revalidatePath("/sessions")
    revalidatePath("/invoices")
    return {
      success: true,
      message: "Order placed successfully!",
      data: order,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to place order"),
    }
  }
}

export async function updateOrderStatusAction(orderId: string, status: string): Promise<ActionResponse> {
  try {
    await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  try {
    const updated = await posService.updateOrderStatus(orderId, status)
    revalidatePath("/pos")
    revalidatePath("/sessions")
    revalidatePath("/")
    return {
      success: true,
      message: `Order status updated to ${status}`,
      data: updated,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update order status"),
    }
  }
}
