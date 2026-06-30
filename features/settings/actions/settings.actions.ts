"use server"

import { revalidatePath } from "next/cache"
import { cafeSettingsSchema, CafeSettingsFormValues } from "../schemas/settings.schema"
import * as settingsService from "../services/settings.service"

import { formatActionError } from "@/lib/errors"

export type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function updateSettingsAction(data: CafeSettingsFormValues): Promise<ActionResponse> {
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
    revalidatePath("/settings")
    return {
      success: true,
      message: "Settings updated successfully",
      data: updated,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update settings"),
    }
  }
}
