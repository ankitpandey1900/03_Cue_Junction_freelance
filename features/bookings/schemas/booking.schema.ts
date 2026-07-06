import { z } from "zod"

export const createBookingSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  tableId: z.string().nullable().optional(),
  tableTypeId: z.string().nullable().optional(),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).default("CONFIRMED"),
})

export type CreateBookingFormValues = z.infer<typeof createBookingSchema>
