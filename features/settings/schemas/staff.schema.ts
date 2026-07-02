import { z } from "zod"

export const createStaffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
})

export const updateStaffStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>
