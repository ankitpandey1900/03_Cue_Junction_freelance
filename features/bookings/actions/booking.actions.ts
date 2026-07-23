"use server"

import { revalidatePath } from "next/cache"
import { Booking } from "@prisma/client"
import { createBookingSchema, CreateBookingFormValues } from "../schemas/booking.schema"
import * as bookingService from "../services/booking.service"
import { formatActionError } from "@/lib/errors"
import { requireSession } from "@/lib/action-auth"
import { logActivity } from "@/features/logs/services/log.service"

import prisma from "@/lib/prisma"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function createBookingAction(data: CreateBookingFormValues): Promise<ActionResponse<Booking>> {
  let authSession
  try {
    authSession = await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  const validated = createBookingSchema.safeParse(data)
  
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // Validate times
  const requestedStart = new Date(validated.data.startTime)
  const requestedEnd = new Date(validated.data.endTime)
  const start = requestedStart.getTime()
  const end = requestedEnd.getTime()
  if (end <= start) {
    return {
      success: false,
      message: "End time must be after start time",
    }
  }

  // Check for conflicts (overlapping bookings) only if a specific table is chosen
  if (validated.data.tableId) {
    const conflicting = await prisma.booking.findFirst({
      where: {
        tableId: validated.data.tableId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: requestedEnd },
        endTime: { gt: requestedStart },
      }
    })

    if (conflicting) {
      return {
        success: false,
        message: "This table is already booked for the selected time",
      }
    }
  }

  try {
    const booking = await bookingService.createBooking(validated.data)
    await logActivity(authSession.user.id, "BOOKING_CREATED", "BOOKING", booking.id, JSON.stringify({ 
      customer: (booking as any).customer.name, 
      table: (booking as any).table?.name || "Unassigned"
    }))
    
    revalidatePath("/bookings")
    return {
      success: true,
      message: "Booking created successfully",
      data: booking,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to create booking"),
    }
  }
}

export async function updateBookingStatusAction(
  id: string, 
  status: string
): Promise<ActionResponse<Booking>> {
  let authSession
  try {
    authSession = await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  try {
    const booking = await bookingService.updateBookingStatus(id, status)
    await logActivity(authSession.user.id, "BOOKING_UPDATED", "BOOKING", booking.id, JSON.stringify({ status }))
    
    revalidatePath("/bookings")
    return {
      success: true,
      message: `Booking marked as ${status}`,
      data: booking,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update booking status"),
    }
  }
}

export async function deleteBookingAction(id: string): Promise<ActionResponse> {
  let authSession
  try {
    authSession = await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  if (authSession.user.role !== "ADMIN") {
    return { success: false, message: "Only administrators can delete bookings" }
  }

  try {
    await bookingService.deleteBooking(id)
    await logActivity(authSession.user.id, "BOOKING_DELETED", "BOOKING", id)
    
    revalidatePath("/bookings")
    return {
      success: true,
      message: "Booking deleted successfully",
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to delete booking"),
    }
  }
}
