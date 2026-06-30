"use server"

import { revalidatePath } from "next/cache"
import { Invoice } from "@prisma/client"
import * as billingService from "../services/billing.service"
import { formatActionError } from "@/lib/errors"
import { requireAdmin, requireSession } from "@/lib/action-auth"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
}

export async function addPaymentAction(
  invoiceId: string,
  amount: number,
  method: string
): Promise<ActionResponse<Invoice>> {
  try {
    await requireSession()
    const updated = await billingService.addPayment(invoiceId, amount, method)
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath("/invoices")
    return {
      success: true,
      message: "Payment recorded successfully",
      data: updated,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to record payment"),
    }
  }
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: string
): Promise<ActionResponse<Invoice>> {
  try {
    await requireSession()
    const updated = await billingService.updateInvoiceStatus(invoiceId, status)
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath("/invoices")
    return {
      success: true,
      message: `Invoice status updated to ${status}`,
      data: updated,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update invoice status"),
    }
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  data: billingService.UpdateInvoiceInput
): Promise<ActionResponse<Invoice>> {
  try {
    await requireSession()
    const updated = await billingService.updateInvoice(invoiceId, data)
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath("/invoices")
    revalidatePath("/reports")
    return {
      success: true,
      message: "Invoice updated successfully",
      data: updated,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to update invoice"),
    }
  }
}

export async function deleteInvoiceAction(invoiceId: string): Promise<ActionResponse<Invoice>> {
  try {
    await requireAdmin()
    const deleted = await billingService.deleteInvoice(invoiceId)
    revalidatePath("/invoices")
    revalidatePath("/reports")
    return {
      success: true,
      message: "Invoice deleted successfully",
      data: deleted,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to delete invoice"),
    }
  }
}
