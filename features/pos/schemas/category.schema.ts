import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  description: z.string().max(200, "Description must be 200 characters or less").optional().nullable().default(""),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().default(true),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
