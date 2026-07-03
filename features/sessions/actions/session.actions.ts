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
    const tableInfo = await prisma.table.findUnique({ 
      where: { id: validated.data.tableId },
      include: { tableType: true } 
    })
    await logActivity(authSession.user.id, "SESSION_STARTED", "SESSION", session.id, JSON.stringify({ 
      tableName: tableInfo?.name || "Table",
      tableType: tableInfo?.tableType?.name
    }))
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
): Promise<ActionResponse<{ session: Session }>> {
  try {
    const authSession = await requireSession()
    const { session } = await sessionService.endSession(sessionId)
    const tableInfo = await prisma.table.findUnique({ where: { id: session.tableId } })
    
    await logActivity(authSession.user.id, "SESSION_ENDED", "SESSION", session.id, JSON.stringify({ 
      tableName: tableInfo?.name || "Table",
    }))
    
    revalidatePath("/sessions")
    revalidatePath("/tables")
    return {
      success: true,
      message: `Session ended.`,
      data: { session },
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to end session"),
    }
  }
}

export async function switchTableAction(
  sessionId: string,
  newTableId: string,
  extraCharges: number = 0
): Promise<ActionResponse<Session>> {
  try {
    const authSession = await requireSession()
    const session = await sessionService.switchTable(sessionId, newTableId, extraCharges)
    
    await logActivity(authSession.user.id, "TABLE_SWITCHED", "SESSION", session.id, JSON.stringify({ 
      newTableId,
    }))
    
    revalidatePath("/sessions")
    revalidatePath("/tables")
    return {
      success: true,
      message: `Switched to new table successfully.`,
      data: session,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to switch table"),
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
