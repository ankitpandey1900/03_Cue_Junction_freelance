"use server"

import { revalidatePath } from "next/cache"
import { Invoice } from "@prisma/client"
import * as billingService from "../services/billing.service"
import { formatActionError } from "@/lib/errors"
import { requireAdmin, requireSession } from "@/lib/action-auth"
import { logActivity } from "@/features/logs/services/log.service"
import prisma from "@/lib/prisma"

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
    const { tableNames, customerName } = await getInvoiceDetails(invoiceId)
    await logActivity(authSession.user.id, "INVOICE_PAID", "INVOICE", invoiceId, JSON.stringify({ amount, method, invoiceNumber: updated.invoiceNumber, tableNames, customerName }))
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
    const authSession = await requireAdmin()
    const updated = await billingService.updateInvoice(invoiceId, data)
    await logActivity(authSession.user.id, "INVOICE_UPDATED", "INVOICE", invoiceId, JSON.stringify({ invoiceNumber: updated.invoiceNumber, ...data }))
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
    const { tableNames, customerName } = await getInvoiceDetails(invoice.id)
    
    await logActivity(authSession.user.id, "CHECKOUT_COMPLETED", "INVOICE", invoice.id, JSON.stringify({ invoiceNumber: invoice.invoiceNumber, tableNames, customerName }))
    
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

async function getInvoiceDetails(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ 
    where: { id: invoiceId }, 
    include: { customer: true, sessions: { include: { table: true } }, orders: true } 
  })
  if (!invoice) return { tableNames: "", customerName: "" }
  
  let tableNames = Array.from(new Set(invoice.sessions.map(s => s.table.name))).join(", ")
  if (!tableNames && invoice.orders.length > 0) {
    tableNames = "Cafe Order"
  }
  
  return { tableNames, customerName: invoice.customer?.name || "" }
}
