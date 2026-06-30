import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
