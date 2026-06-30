import { z } from "zod"

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.coerce.number().min(1),
})

export const placeOrderSchema = z.object({
  sessionId: z.string().optional(),
  customerId: z.string().optional(),
  notes: z.string().max(200, "Notes must be 200 characters or less").optional(),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  tax: z.coerce.number().min(0, "Tax cannot be negative").default(0),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
})

export type PlaceOrderValues = z.infer<typeof placeOrderSchema>
