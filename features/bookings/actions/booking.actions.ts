"use server"

import { revalidatePath } from "next/cache"
import { Booking } from "@prisma/client"
import { bookingSchema, BookingFormValues } from "../schemas/booking.schema"
import * as bookingService from "../services/booking.service"
import { requireSession } from "@/lib/action-auth"
import { formatActionError } from "@/lib/errors"

type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export async function createBookingAction(data: BookingFormValues): Promise<ActionResponse<Booking>> {
  try {
    await requireSession()
  } catch (error) {
    return { success: false, message: formatActionError(error, "Unauthorized. Please log in.") }
  }

  const validated = bookingSchema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const booking = await bookingService.createBooking(validated.data)
    revalidatePath("/bookings")
    revalidatePath("/")
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

export async function updateBookingStatusAction(id: string, status: string): Promise<ActionResponse<Booking>> {
  try {
    await requireSession()
    const booking = await bookingService.updateBookingStatus(id, status)
    revalidatePath("/bookings")
    revalidatePath("/")
    return {
      success: true,
      message: `Booking marked ${status}`,
      data: booking,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update booking"),
    }
  }
}

export async function deleteBookingAction(id: string): Promise<ActionResponse<Booking>> {
  try {
    await requireSession()
    const booking = await bookingService.deleteBooking(id)
    revalidatePath("/bookings")
    revalidatePath("/")
    return {
      success: true,
      message: "Booking deleted successfully",
      data: booking,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to delete booking"),
    }
  }
}
