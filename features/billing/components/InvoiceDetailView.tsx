"use client"

import { useState, useEffect } from "react"
import { formatInTimeZone } from "date-fns-tz"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  addPaymentAction,
  deleteInvoiceAction,
  updateInvoiceAction,
  updateInvoiceStatusAction,
} from "../actions/billing.actions"
import { toast } from "sonner"
import { ArrowLeft, Printer, CreditCard, Receipt, Ban, RotateCcw, AlertTriangle, Send, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatCurrency, formatInvoiceNumber } from "@/lib/formatters"

type Payment = {
  id: string
  amount: number
  method: string
  paidAt: Date | string
}

type OrderItem = {
  id: string
  itemNameSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  totalPrice: number
}

type SessionOrder = {
  id: string
  status: string
  orderItems: OrderItem[]
}

type InvoiceViewModel = {
  id: string
  invoiceNumber?: number | null
  createdAt: Date | string
  sessionTotal: number
  cafeTotal: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  status: string
  paymentMethod?: string | null
  notes?: string | null
  customer: {
    name: string
    phone: string
    email?: string | null
  } | null
  payments: Payment[]
  sessions: {
    id: string
    startTime: Date | string
    endTime?: Date | string | null
    totalPauseDurationSeconds: number
    table: {
      name: string
      tableType: {
        name: string
        hourlyRate: number
      }
    }
  }[]
  orders: SessionOrder[]
}

function formatPlayedDuration(session: InvoiceViewModel["sessions"][0] | null, fallbackEnd: Date | string) {
  if (!session) return "No session time recorded"

  const start = new Date(session.startTime).getTime()
  const end = session.endTime ? new Date(session.endTime).getTime() : new Date(fallbackEnd).getTime()
  const rawSeconds = Math.max(0, Math.floor((end - start) / 1000) - session.totalPauseDurationSeconds)
  const hours = Math.floor(rawSeconds / 3600)
  const minutes = Math.floor((rawSeconds % 3600) / 60)
  const seconds = rawSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

type SettingsViewModel = {
  cafeName: string
  address?: string | null
  phone?: string | null
  gstin?: string | null
  receiptFooterText?: string | null
}

function statusClass(status: string) {
  if (status === "PAID") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  if (status === "PARTIAL") return "bg-blue-500/10 text-blue-500 border-blue-500/20"
  if (status === "CANCELLED") return "bg-red-500/10 text-red-500 border-red-500/20"
  if (status === "REFUNDED") return "bg-purple-500/10 text-purple-500 border-purple-500/20"
  if (status === "UNPAID") return "bg-amber-500/10 text-amber-500 border-amber-500/20"
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
}

export function InvoiceDetailView({
  invoice: initialInvoice,
  settings,
  staffUsers,
}: {
  invoice: InvoiceViewModel
  settings: SettingsViewModel
  staffUsers: { id: string; name: string | null }[]
}) {
  const router = useRouter()
  const [invoice, setInvoice] = useState(initialInvoice)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI")
  const [receivedById, setReceivedById] = useState<string>("DEFAULT")
  const [loading, setLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editValues, setEditValues] = useState({
    sessionTotal: initialInvoice.sessionTotal,
    cafeTotal: initialInvoice.cafeTotal,
    discountAmount: initialInvoice.discountAmount,
    status: initialInvoice.status,
    paymentMethod: initialInvoice.paymentMethod || "CASH",
    notes: initialInvoice.notes || "",
  })

  useEffect(() => {
    setEditValues(current => ({
      ...current,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod || current.paymentMethod
    }))
  }, [invoice.status, invoice.paymentMethod])

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Invoice not found</p>
      </div>
    )
  }

  const invoiceLabel = formatInvoiceNumber(invoice.invoiceNumber, invoice.id)
  const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingBalance = Math.max(0, invoice.grandTotal - paidAmount)
  const subtotal = invoice.sessionTotal + invoice.cafeTotal
  const primarySession = invoice.sessions?.[0] ?? null
  const cafeItems = invoice.orders?.flatMap((order) => order.orderItems) ?? []
  const playedDuration = formatPlayedDuration(primarySession, invoice.createdAt)

  const handleAddPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (paymentAmount <= 0) {
      toast.error("Please enter a positive amount")
      return
    }
    if (paymentAmount > remainingBalance + 0.01) {
      toast.error(`Amount exceeds remaining balance of ${formatCurrency(remainingBalance, 2)}`)
      return
    }

    setLoading(true)
    try {
      const actualReceivedBy = receivedById === "DEFAULT" ? undefined : (receivedById || undefined)
      const response = await addPaymentAction(invoice.id, paymentAmount, paymentMethod, actualReceivedBy)
      if (response.success && response.data) {
        const updatedInvoice = response.data
        toast.success(response.message)
        setInvoice((previous) => ({
          ...previous,
          status: updatedInvoice.status,
          paymentMethod: updatedInvoice.paymentMethod,
          payments: [
            ...previous.payments,
            {
              id: crypto.randomUUID(),
              amount: paymentAmount,
              method: paymentMethod,
              paidAt: new Date().toISOString(),
            },
          ],
        }))
        setPaymentAmount(0)
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to change status to ${status}?`)) return
    setLoading(true)
    try {
      const response = await updateInvoiceStatusAction(invoice.id, status)
      if (response.success && response.data) {
        const updatedInvoice = response.data
        toast.success(response.message)
        setInvoice((previous) => ({
          ...previous,
          status: updatedInvoice.status,
        }))
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateInvoice = async (event: React.FormEvent) => {
    event.preventDefault()
    setEditLoading(true)
    try {
      const response = await updateInvoiceAction(invoice.id, editValues)
      if (response.success && response.data) {
        const updatedInvoice = response.data
        toast.success(response.message)
        setInvoice((previous) => ({
          ...previous,
          sessionTotal: updatedInvoice.sessionTotal,
          cafeTotal: updatedInvoice.cafeTotal,
          taxAmount: 0,
          discountAmount: updatedInvoice.discountAmount,
          grandTotal: updatedInvoice.grandTotal,
          status: updatedInvoice.status,
          paymentMethod: updatedInvoice.paymentMethod,
          notes: updatedInvoice.notes,
        }))
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to update invoice")
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!confirm(`Delete ${invoiceLabel}? This removes the invoice and its payments permanently.`)) return
    setDeleteLoading(true)
    try {
      const response = await deleteInvoiceAction(invoice.id)
      if (response.success) {
        toast.success(response.message)
        router.push("/invoices")
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to delete invoice")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Invoices
          </Button>
        </Link>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button onClick={() => window.print()} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            onClick={() => toast.success(`Invoice queued for ${invoice.customer?.email || "customer"}`)}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <Send className="h-3.5 w-3.5" />
            Email
          </Button>
          {invoice.status !== "CANCELLED" && invoice.status !== "REFUNDED" && (
            <Button
              onClick={() => handleUpdateStatus("CANCELLED")}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
              disabled={loading}
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
          {invoice.status === "PAID" && (
            <Button
              onClick={() => handleUpdateStatus("REFUNDED")}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-amber-500 hover:text-amber-500 hover:bg-amber-500/10 border-border"
              disabled={loading}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Refund
            </Button>
          )}
          <Button
            onClick={handleDeleteInvoice}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
            disabled={deleteLoading}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Card className="border-border shadow-md print:border-none print:shadow-none bg-card">
          <CardContent className="p-5 sm:p-8 space-y-6">
            <div className="text-center pb-4 border-b border-border/80 space-y-1.5">
              <h2 className="text-lg font-bold text-foreground tracking-tight uppercase">
                {settings.cafeName}
              </h2>
              {settings.address && (
                <p className="text-[11px] text-muted-foreground whitespace-pre-line">
                  {settings.address}
                </p>
              )}
              {settings.phone && <p className="text-[11px] text-muted-foreground">Tel: {settings.phone}</p>}
              {settings.gstin && <p className="text-[10px] text-muted-foreground font-semibold">GSTIN: {settings.gstin}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <p className="text-muted-foreground">
                  Invoice ID: <span className="font-semibold text-foreground font-mono">{invoiceLabel}</span>
                </p>
                <p className="text-muted-foreground">
                  Date: <span className="font-medium text-foreground">{formatInTimeZone(new Date(invoice.createdAt), "Asia/Kolkata", "MMM dd, yyyy h:mm a")}</span>
                </p>
                {primarySession?.table && (
                  <p className="text-muted-foreground">
                    Table / Asset: <span className="font-semibold text-foreground">{primarySession.table.name}</span>
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:text-right">
                <p className="text-muted-foreground">
                  Customer: <span className="font-semibold text-foreground">{invoice.customer?.name || "Walk-in Guest"}</span>
                </p>
                {invoice.customer?.phone && (
                  <p className="text-muted-foreground">
                    Phone: <span className="font-medium text-foreground">{invoice.customer.phone}</span>
                  </p>
                )}
                <Badge variant="secondary" className={`text-[9px] font-semibold uppercase tracking-wider ${statusClass(invoice.status)}`}>
                  {invoice.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1">
                Charges Summary
              </p>

              {invoice.sessions && invoice.sessions.length > 0 && (
                <div className="space-y-2 pb-2.5 border-b border-border/30">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Play Sessions
                  </p>
                  {invoice.sessions.map(session => {
                    const end = session.endTime ? new Date(session.endTime).getTime() : new Date().getTime()
                    const start = new Date(session.startTime).getTime()
                    let mins = Math.floor((end - start) / 60000)
                    mins -= Math.floor(session.totalPauseDurationSeconds / 60)
                    if (mins < 1) mins = 1
                    const hrs = Math.floor(mins / 60)
                    const remainingMins = mins % 60
                    const durationStr = hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins}m`

                    return (
                      <div key={session.id} className="flex justify-between items-start text-xs gap-4">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{session.table.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {session.table.tableType.name} ({formatCurrency(session.table.tableType.hourlyRate)}/hr) · Played {durationStr}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {invoice.sessionTotal > 0 && (
                    <div className="flex justify-between items-start text-xs pt-1.5 border-t border-border/20 mt-1.5">
                      <div className="font-semibold text-foreground">Total Session Charge</div>
                      <span className="font-mono text-foreground font-semibold">{formatCurrency(invoice.sessionTotal, 2)}</span>
                    </div>
                  )}
                </div>
              )}

              {cafeItems.length > 0 && (
                <div className="space-y-2 pb-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Cafe Orders
                  </p>
                  {cafeItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs gap-4">
                      <div>
                        <p className="font-medium text-foreground">{item.itemNameSnapshot}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {formatCurrency(item.unitPriceSnapshot)} x {item.quantity}
                        </p>
                      </div>
                      <span className="font-mono text-muted-foreground">{formatCurrency(item.totalPrice, 2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border/80 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal, 2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(invoice.discountAmount, 2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-dashed border-border/50">
                <span>Grand Total</span>
                <span className="font-mono text-lg">{formatCurrency(invoice.grandTotal, 2)}</span>
              </div>
            </div>

            {settings.receiptFooterText && (
              <div className="text-center text-[10px] text-muted-foreground pt-4 border-t border-border/40">
                <p className="italic">{settings.receiptFooterText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 print:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Edit Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateInvoice} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Session Total</Label>
                    <Input
                      type="number"
                      value={editValues.sessionTotal === 0 ? "" : editValues.sessionTotal}
                      onChange={(event) => setEditValues((current) => ({ ...current, sessionTotal: event.target.value === "" ? 0 : Number(event.target.value) }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cafe Total</Label>
                    <Input
                      type="number"
                      value={editValues.cafeTotal === 0 ? "" : editValues.cafeTotal}
                      onChange={(event) => setEditValues((current) => ({ ...current, cafeTotal: event.target.value === "" ? 0 : Number(event.target.value) }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Discount</Label>
                  <Input
                    type="number"
                    value={editValues.discountAmount === 0 ? "" : editValues.discountAmount}
                    onChange={(event) => setEditValues((current) => ({ ...current, discountAmount: Math.max(0, event.target.value === "" ? 0 : Number(event.target.value)) }))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <select
                      value={editValues.status}
                      onChange={(event) => setEditValues((current) => ({ ...current, status: event.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    >
                      <option value="UNPAID">UNPAID</option>
                      <option value="PARTIAL">PARTIAL</option>
                      <option value="PAID">PAID</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Method</Label>
                    <select
                      value={editValues.paymentMethod}
                      onChange={(event) => setEditValues((current) => ({ ...current, paymentMethod: event.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI</option>
                      <option value="MIXED">MIXED</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    value={editValues.notes}
                    onChange={(event) => setEditValues((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-16 text-xs"
                  />
                </div>
                <Button type="submit" disabled={editLoading} size="sm" className="w-full h-8 text-xs gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Save Invoice
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Paid</span>
                  <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(paidAmount, 2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Balance</span>
                  <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(remainingBalance, 2)}</p>
                </div>
              </div>

              {remainingBalance > 0 && (
                <form onSubmit={handleAddPayment} className="space-y-3 pt-2 border-t border-border/40">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Record Payment</Label>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={paymentAmount || ""}
                      onChange={(event) => setPaymentAmount(Math.max(0, Number(event.target.value)))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-1">
                      {["UPI", "CASH"].map((method) => (
                        <Button
                          key={method}
                          type="button"
                          variant={paymentMethod === method ? "default" : "outline"}
                          className="h-7 text-[10px] font-semibold"
                          onClick={() => setPaymentMethod(method)}
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Received By (Staff)</Label>
                    <Select value={receivedById} onValueChange={(val) => setReceivedById(val || "DEFAULT")}>
                      <SelectTrigger className="w-full h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEFAULT">Default (Me)</SelectItem>
                        {staffUsers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name || "Unknown Staff"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={loading} size="sm" className="w-full h-8 text-xs gap-1.5 mt-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.payments.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No payments recorded.</div>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3">
                      <div>
                        <p className="font-semibold text-foreground">{formatCurrency(payment.amount, 2)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatInTimeZone(new Date(payment.paidAt), "Asia/Kolkata", "MMM dd, h:mm a")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] font-medium font-mono">
                        {payment.method}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
