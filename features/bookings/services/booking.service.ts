import prisma from "@/lib/prisma"
import { CreateBookingFormValues } from "../schemas/booking.schema"

export async function getBookings() {
  return await prisma.booking.findMany({
    include: {
      customer: true,
      table: {
        include: {
          tableType: true
        }
      },
      tableType: true
    } as any,
    orderBy: {
      startTime: "asc"
    }
  })
}

export async function getUpcomingBookings() {
  return await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      endTime: { gte: new Date() }
    },
    include: {
      customer: true,
      table: {
        include: {
          tableType: true
        }
      },
      tableType: true
    } as any,
    orderBy: {
      startTime: "asc"
    }
  })
}

export async function createBooking(data: CreateBookingFormValues) {
  return await prisma.booking.create({
    data: {
      customerId: data.customerId,
      tableId: (data.tableId || null) as any,
      tableTypeId: (data.tableTypeId || null) as any,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      status: data.status,
    },
    include: {
      customer: true,
      table: {
        include: {
          tableType: true
        }
      },
      tableType: true
    } as any
  })
}

export async function updateBookingStatus(id: string, status: string) {
  return await prisma.booking.update({
    where: { id },
    data: { status }
  })
}

export async function deleteBooking(id: string) {
  return await prisma.booking.delete({
    where: { id }
  })
}
