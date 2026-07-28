import { z } from "zod"

export const startSessionSchema = z.object({
  tableId: z.string().min(1, "Table is required"),
  customerId: z.string().optional(), // Optional for guest sessions
  bookingId: z.string().optional(),
  extraHourlyRate: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export type StartSessionFormValues = z.infer<typeof startSessionSchema>
