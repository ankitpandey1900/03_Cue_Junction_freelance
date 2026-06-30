"use server"

import { revalidatePath } from "next/cache"
import { tableSchema, tableTypeSchema, TableFormValues, TableTypeFormValues } from "../schemas/table.schema"
import * as tableService from "../services/table.service"
import { formatActionError } from "@/lib/errors"

export type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function createTableAction(data: TableFormValues): Promise<ActionResponse> {
  const validated = tableSchema.safeParse(data)
  
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const table = await tableService.createTable(validated.data)
    revalidatePath("/tables")
    revalidatePath("/tables/manage")
    return {
      success: true,
      message: "Table created successfully",
      data: table,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create table"),
    }
  }
}

export async function updateTableAction(id: string, data: TableFormValues): Promise<ActionResponse> {
  const validated = tableSchema.safeParse(data)
  
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const table = await tableService.updateTable(id, validated.data)
    revalidatePath("/tables")
    revalidatePath("/tables/manage")
    return {
      success: true,
      message: "Table updated successfully",
      data: table,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update table"),
    }
  }
}

export async function updateTableStatusAction(id: string, status: string): Promise<ActionResponse> {
  try {
    const table = await tableService.updateTableStatus(id, status)
    revalidatePath("/tables")
    return {
      success: true,
      message: `Table status changed to ${status}`,
      data: table,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update table status"),
    }
  }
}

export async function createTableTypeAction(data: TableTypeFormValues): Promise<ActionResponse> {
  const validated = tableTypeSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const tableType = await tableService.createTableType(validated.data)
    revalidatePath("/tables")
    revalidatePath("/tables/manage")
    return {
      success: true,
      message: "Table type created successfully",
      data: tableType,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create table type"),
    }
  }
}

export async function updateTableTypeAction(id: string, data: TableTypeFormValues): Promise<ActionResponse> {
  const validated = tableTypeSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const tableType = await tableService.updateTableType(id, validated.data)
    revalidatePath("/tables")
    revalidatePath("/tables/manage")
    return {
      success: true,
      message: "Table type updated successfully",
      data: tableType,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update table type"),
    }
  }
}

export async function deleteTableAction(id: string): Promise<ActionResponse> {
  try {
    await tableService.deleteTable(id)
    revalidatePath("/tables")
    revalidatePath("/tables/manage")
    return {
      success: true,
      message: "Table removed successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to remove table. Please try again.",
    }
  }
}

export async function deleteTableTypeAction(id: string): Promise<ActionResponse> {
  try {
    await tableService.deleteTableType(id)
    revalidatePath("/tables")
    revalidatePath("/tables/manage")
    return {
      success: true,
      message: "Table type removed successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to remove table type. Please try again.",
    }
  }
}
