"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/action-auth"
import { formatActionError } from "@/lib/errors"
import { logActivity } from "@/features/logs/services/log.service"
import { createStaffSchema, updateStaffStatusSchema, CreateStaffFormValues } from "../schemas/staff.schema"
import * as staffService from "../services/staff.service"

type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function createStaffAction(data: CreateStaffFormValues): Promise<ActionResponse<staffService.StaffMember>> {
  let session
  try {
    session = await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  const validated = createStaffSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const staff = await staffService.createStaff(validated.data)
    await logActivity(session.user.id, "STAFF_CREATED", "USER", staff.id, JSON.stringify({ email: staff.email, role: staff.role }))
    revalidatePath("/settings")
    revalidatePath("/logs")
    return { success: true, message: "Staff login created successfully", data: staff }
  } catch (error: unknown) {
    return { success: false, message: formatActionError(error, "Failed to create staff login") }
  }
}

export async function updateStaffStatusAction(id: string, status: "ACTIVE" | "INACTIVE"): Promise<ActionResponse<staffService.StaffMember>> {
  let session
  try {
    session = await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  const validated = updateStaffStatusSchema.safeParse({ id, status })
  if (!validated.success) {
    return { success: false, message: "Validation failed", errors: validated.error.flatten().fieldErrors }
  }

  try {
    const staff = await staffService.updateStaffStatus(validated.data.id, validated.data.status)
    await logActivity(session.user.id, `STAFF_${validated.data.status}`, "USER", staff.id, JSON.stringify({ email: staff.email }))
    revalidatePath("/settings")
    revalidatePath("/logs")
    return { success: true, message: `Staff access set to ${validated.data.status}`, data: staff }
  } catch (error: unknown) {
    return { success: false, message: formatActionError(error, "Failed to update staff access") }
  }
}
