import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
