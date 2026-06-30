import { z } from "zod"

export const tableTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  hourlyRate: z.number().min(0, "Rate must be positive"),
  minimumCharge: z.number().min(0, "Minimum charge must be positive"),
  fixedRate: z.number().min(0, "Fixed rate must be positive").optional().nullable(),
  fixedDuration: z.number().min(0, "Fixed duration must be positive").optional().nullable(),
  overtimeHourlyRate: z.number().min(0, "Overtime rate must be positive").optional().nullable(),
})

export const tableSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  tableTypeId: z.string().min(1, "Table type is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
})

export type TableTypeFormValues = z.infer<typeof tableTypeSchema>
export type TableFormValues = z.infer<typeof tableSchema>
