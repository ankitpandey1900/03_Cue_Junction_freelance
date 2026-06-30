"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@prisma/client"
import { startSessionSchema, StartSessionFormValues } from "../schemas/session.schema"
import * as sessionService from "../services/session.service"

import { formatActionError } from "@/lib/errors"
import { requireSession } from "@/lib/action-auth"
import { formatCurrency } from "@/lib/formatters"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function startSessionAction(data: StartSessionFormValues): Promise<ActionResponse<Session>> {
  try {
    await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

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
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to start session"),
    }
  }
}

export async function endSessionAction(
  sessionId: string
): Promise<ActionResponse<{ session: Session; totalCost: number; invoiceId: string }>> {
  try {
    await requireSession()
    const { session, totalCost, invoiceId } = await sessionService.endSession(sessionId)
    revalidatePath("/sessions")
    revalidatePath("/tables")
    revalidatePath("/invoices")
    return {
      success: true,
      message: `Session ended. Total Cost: ${formatCurrency(totalCost, 2)}`,
      data: { session, totalCost, invoiceId },
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to end session"),
    }
  }
}
