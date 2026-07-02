"use server"

import { revalidatePath } from "next/cache"
import { Invoice } from "@prisma/client"
import * as billingService from "../services/billing.service"
import { formatActionError } from "@/lib/errors"
import { requireAdmin, requireSession } from "@/lib/action-auth"
import { logActivity } from "@/features/logs/services/log.service"

export type ActionResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
}

export async function addPaymentAction(
  invoiceId: string,
  amount: number,
  method: string,
  receivedById?: string
): Promise<ActionResponse<Invoice>> {
  try {
    const authSession = await requireSession()
    const updated = await billingService.addPayment(invoiceId, amount, method, receivedById || authSession.user.id)
    await logActivity(authSession.user.id, "INVOICE_PAID", "INVOICE", invoiceId, JSON.stringify({ amount, method, invoiceNumber: updated.invoiceNumber }))
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
    const authSession = await requireSession()
    const updated = await billingService.updateInvoiceStatus(invoiceId, status)
    await logActivity(authSession.user.id, `INVOICE_${status}`, "INVOICE", invoiceId, JSON.stringify({ invoiceNumber: updated.invoiceNumber }))
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
    const authSession = await requireSession()
    const updated = await billingService.updateInvoice(invoiceId, data)
    await logActivity(authSession.user.id, "INVOICE_UPDATED", "INVOICE", invoiceId, JSON.stringify({ invoiceNumber: updated.invoiceNumber }))
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
    const authSession = await requireAdmin()
    const deleted = await billingService.deleteInvoice(invoiceId)
    await logActivity(authSession.user.id, "INVOICE_DELETED", "INVOICE", invoiceId, JSON.stringify({ invoiceNumber: deleted.invoiceNumber }))
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

export async function checkoutCustomerAction(
  customerId?: string,
  sessionId?: string
): Promise<ActionResponse<Invoice>> {
  try {
    const authSession = await requireSession()
    const invoice = await billingService.checkoutCustomer(customerId, sessionId)
    
    await logActivity(authSession.user.id, "CHECKOUT_COMPLETED", "INVOICE", invoice.id, JSON.stringify({ invoiceNumber: invoice.invoiceNumber }))
    
    revalidatePath("/invoices")
    revalidatePath("/sessions")
    revalidatePath("/customers")
    revalidatePath("/tables")
    
    return {
      success: true,
      message: "Checkout successful, invoice generated.",
      data: invoice,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: formatActionError(error, "Failed to checkout"),
    }
  }
}
