"use server"

import { revalidatePath } from "next/cache"
import { startSessionSchema, StartSessionFormValues } from "../schemas/session.schema"
import * as sessionService from "../services/session.service"

import { formatActionError } from "@/lib/errors"

export type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function startSessionAction(data: StartSessionFormValues): Promise<ActionResponse> {
  const validated = startSessionSchema.safeParse(data)
  
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const session = await sessionService.startSession(validated.data)
    revalidatePath("/sessions")
    revalidatePath("/tables")
    return {
      success: true,
      message: "Session started successfully",
      data: session,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to start session"),
    }
  }
}

export async function endSessionAction(sessionId: string): Promise<ActionResponse> {
  try {
    const { session, totalCost, invoiceId } = await sessionService.endSession(sessionId)
    revalidatePath("/sessions")
    revalidatePath("/tables")
    revalidatePath("/invoices")
    return {
      success: true,
      message: `Session ended. Total Cost: ₹${totalCost.toFixed(2)}`,
      data: { session, totalCost, invoiceId },
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to end session"),
    }
  }
}
