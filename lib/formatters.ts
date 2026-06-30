export function formatInvoiceNumber(invoiceNumber?: number | null, fallbackId?: string) {
  if (typeof invoiceNumber === "number" && Number.isFinite(invoiceNumber)) {
    return `#${invoiceNumber.toString().padStart(5, "0")}`
  }

  return fallbackId ? `#${fallbackId.slice(-6).toUpperCase()}` : "#-----"
}

export function formatCurrency(amount: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(amount)
}

export function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
