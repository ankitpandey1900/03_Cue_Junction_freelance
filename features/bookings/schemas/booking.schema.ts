import { z } from "zod"

export const bookingSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  tableId: z.string().min(1, "Table is required"),
  startTime: z.string().datetime("Start time is invalid"),
  endTime: z.string().datetime("End time is invalid"),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
})

export type BookingFormValues = z.infer<typeof bookingSchema>
