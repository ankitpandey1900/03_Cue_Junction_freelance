"use server"

import { revalidatePath } from "next/cache"
import { customerSchema, CustomerFormValues } from "../schemas/customer.schema"
import * as customerService from "../services/customer.service"

import { formatActionError } from "@/lib/errors"

export type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function createCustomerAction(data: CustomerFormValues): Promise<ActionResponse> {
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
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create customer"),
    }
  }
}

export async function updateCustomerAction(id: string, data: CustomerFormValues): Promise<ActionResponse> {
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
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update customer"),
    }
  }
}
