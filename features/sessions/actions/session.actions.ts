"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@prisma/client"
import { startSessionSchema, StartSessionFormValues } from "../schemas/session.schema"
import * as sessionService from "../services/session.service"
import prisma from "@/lib/prisma"

import { formatActionError } from "@/lib/errors"
import { requireSession } from "@/lib/action-auth"
import { formatCurrency } from "@/lib/formatters"
import { logActivity } from "@/features/logs/services/log.service"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function startSessionAction(data: StartSessionFormValues): Promise<ActionResponse<Session>> {
  let authSession
  try {
    authSession = await requireSession()
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
    const tableInfo = await prisma.table.findUnique({ where: { id: validated.data.tableId } })
    await logActivity(authSession.user.id, "SESSION_STARTED", "SESSION", session.id, JSON.stringify({ tableName: tableInfo?.name || "Table" }))
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
    const authSession = await requireSession()
    const { session, totalCost, invoiceId } = await sessionService.endSession(sessionId)
    const tableInfo = await prisma.table.findUnique({ where: { id: session.tableId } })
    const invoiceInfo = invoiceId ? await prisma.invoice.findUnique({ where: { id: invoiceId } }) : null
    
    await logActivity(authSession.user.id, "SESSION_ENDED", "SESSION", session.id, JSON.stringify({ 
      tableName: tableInfo?.name || "Table",
      invoiceNumber: invoiceInfo?.invoiceNumber 
    }))
    
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

export async function pauseSessionAction(sessionId: string): Promise<ActionResponse<Session>> {
  try {
    const authSession = await requireSession()
    const session = await sessionService.pauseSession(sessionId)
    const tableInfo = await prisma.table.findUnique({ where: { id: session.tableId } })
    
    await logActivity(authSession.user.id, "SESSION_PAUSED", "SESSION", session.id, JSON.stringify({ 
      tableName: tableInfo?.name || "Table" 
    }))
    
    revalidatePath("/sessions")
    revalidatePath("/tables")
    return {
      success: true,
      message: "Session paused successfully",
      data: session,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to pause session"),
    }
  }
}

export async function resumeSessionAction(sessionId: string): Promise<ActionResponse<Session>> {
  try {
    const authSession = await requireSession()
    const session = await sessionService.resumeSession(sessionId)
    const tableInfo = await prisma.table.findUnique({ where: { id: session.tableId } })
    
    await logActivity(authSession.user.id, "SESSION_RESUMED", "SESSION", session.id, JSON.stringify({ 
      tableName: tableInfo?.name || "Table" 
    }))
    
    revalidatePath("/sessions")
    revalidatePath("/tables")
    return {
      success: true,
      message: "Session resumed successfully",
      data: session,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to resume session"),
    }
  }
}
