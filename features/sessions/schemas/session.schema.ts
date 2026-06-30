import { z } from "zod"

export const startSessionSchema = z.object({
  tableId: z.string().min(1, "Table is required"),
  customerId: z.string().optional(), // Optional for guest sessions
  notes: z.string().optional(),
})

export type StartSessionFormValues = z.infer<typeof startSessionSchema>
