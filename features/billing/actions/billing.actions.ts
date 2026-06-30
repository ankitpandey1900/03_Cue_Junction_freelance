"use server"

import { revalidatePath } from "next/cache"
import * as billingService from "../services/billing.service"
import { formatActionError } from "@/lib/errors"

export type ActionResponse<T = any> = {
  success: boolean
  message: string
  data?: T
}

export async function addPaymentAction(
  invoiceId: string,
  amount: number,
  method: string
): Promise<ActionResponse> {
  try {
    const updated = await billingService.addPayment(invoiceId, amount, method)
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath("/invoices")
    return {
      success: true,
      message: "Payment recorded successfully",
      data: updated,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to record payment"),
    }
  }
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: string
): Promise<ActionResponse> {
  try {
    const updated = await billingService.updateInvoiceStatus(invoiceId, status)
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath("/invoices")
    return {
      success: true,
      message: `Invoice status updated to ${status}`,
      data: updated,
    }
  } catch (error: any) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update invoice status"),
    }
  }
}
