import { z } from "zod"

export const menuItemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(300, "Description must be 300 characters or less").optional().nullable().default(""),
  basePrice: z.number().min(0, "Base price cannot be negative"),
  stock: z.number().int().min(0, "Stock quantity cannot be negative").default(0),
  
  // Backwards compatible fields made optional with fallback defaults
  sku: z.string().max(30).optional().nullable().default(""),
  imageUrl: z.string().optional().nullable().default(""),
  preparationTime: z.number().int().min(1).default(10),
  displayOrder: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export type MenuItemFormValues = z.infer<typeof menuItemSchema>
