import { Booking, Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { BookingFormValues } from "../schemas/booking.schema"

export type BookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    customer: true
    table: {
      include: {
        tableType: true
      }
    }
  }
}>

export async function getBookings(): Promise<BookingWithDetails[]> {
  return await prisma.booking.findMany({
    include: {
      customer: true,
      table: {
        include: {
          tableType: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  })
}

async function assertSlotAvailable(tableId: string, startTime: Date, endTime: Date, excludeId?: string) {
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      tableId,
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  })

  if (overlappingBooking) {
    throw new Error("This table already has a booking in that time slot.")
  }
}

export async function createBooking(data: BookingFormValues): Promise<Booking> {
  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)

  await assertSlotAvailable(data.tableId, startTime, endTime)

  return await prisma.booking.create({
    data: {
      customerId: data.customerId,
      tableId: data.tableId,
      startTime,
      endTime,
      status: "CONFIRMED",
    },
  })
}

export async function updateBookingStatus(id: string, status: string): Promise<Booking> {
  return await prisma.booking.update({
    where: { id },
    data: { status },
  })
}

export async function deleteBooking(id: string): Promise<Booking> {
  return await prisma.booking.delete({
    where: { id },
  })
}
