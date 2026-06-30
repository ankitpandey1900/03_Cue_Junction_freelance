import { z } from "zod"

export const cafeSettingsSchema = z.object({
  cafeName: z.string().min(1, "Cafe Name is required"),
  defaultHourlyRate: z.number().min(0, "Rate must be positive"),
  receiptFooterText: z.string().optional().nullable(),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Must be a valid email").or(z.literal("")).optional().nullable(),
  currency: z.string(),
  taxRate: z.number().min(0, "Tax rate must be positive"),
  gstin: z.string().optional().nullable(),
  businessHours: z.string().optional().nullable(),
})

export type CafeSettingsFormValues = z.infer<typeof cafeSettingsSchema>
