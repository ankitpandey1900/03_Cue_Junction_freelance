"use server"

import { revalidatePath } from "next/cache"
import { customerSchema, CustomerFormValues } from "../schemas/customer.schema"
import * as customerService from "../services/customer.service"

import { formatActionError } from "@/lib/errors"
import { requireSession } from "@/lib/action-auth"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function createCustomerAction(data: CustomerFormValues): Promise<ActionResponse> {
  try {
    await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  // Validate input
  const validated = customerSchema.safeParse(data)
  
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // Check if phone exists
  const phoneExists = await customerService.checkPhoneExists(validated.data.phone)
  if (phoneExists) {
    return {
      success: false,
      message: "A customer with this phone number already exists",
    }
  }

  try {
    const customer = await customerService.createCustomer(validated.data)
    revalidatePath("/customers")
    return {
      success: true,
      message: "Customer created successfully",
      data: customer,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create customer"),
    }
  }
}

export async function updateCustomerAction(id: string, data: CustomerFormValues): Promise<ActionResponse> {
  try {
    await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  const validated = customerSchema.safeParse(data)
  
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const phoneExists = await customerService.checkPhoneExists(validated.data.phone, id)
  if (phoneExists) {
    return {
      success: false,
      message: "A customer with this phone number already exists",
    }
  }

  try {
    const customer = await customerService.updateCustomer(id, validated.data)
    revalidatePath("/customers")
    revalidatePath(`/customers/${id}`)
    return {
      success: true,
      message: "Customer updated successfully",
      data: customer,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update customer"),
    }
  }
}
