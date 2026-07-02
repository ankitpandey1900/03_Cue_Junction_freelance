"use server"

import { revalidatePath } from "next/cache"
import { cafeSettingsSchema, CafeSettingsFormValues } from "../schemas/settings.schema"
import * as settingsService from "../services/settings.service"

import { formatActionError } from "@/lib/errors"
import { requireAdmin } from "@/lib/action-auth"
import { logActivity } from "@/features/logs/services/log.service"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function updateSettingsAction(data: CafeSettingsFormValues): Promise<ActionResponse> {
  let session
  try {
    session = await requireAdmin()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized: Admins only") }
  }

  const validated = cafeSettingsSchema.safeParse(data)
  
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const updated = await settingsService.updateSettings(validated.data)
    await logActivity(session.user.id, "SETTINGS_UPDATED", "SETTINGS", updated.id)
    revalidatePath("/settings")
    revalidatePath("/logs")
    return {
      success: true,
      message: "Settings updated successfully",
      data: updated,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update settings"),
    }
  }
}
