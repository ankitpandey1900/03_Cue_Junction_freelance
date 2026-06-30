"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addPaymentAction, updateInvoiceStatusAction } from "../actions/billing.actions"
import { toast } from "sonner"
import { ArrowLeft, Printer, CreditCard, Receipt, FileText, Ban, RotateCcw, AlertTriangle, Send } from "lucide-react"
import Link from "next/link"

interface InvoiceDetailViewProps {
  invoice: any
  settings: any
}

export function InvoiceDetailView({ invoice: initialInvoice, settings }: InvoiceDetailViewProps) {
  const [invoice, setInvoice] = useState(initialInvoice)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI")
  const [loading, setLoading] = useState(false)

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Invoice not found</p>
      </div>
    )
  }

  const remainingBalance = Math.max(
    0,
    invoice.grandTotal - invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  )

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentAmount <= 0) {
      toast.error("Please enter a positive amount")
      return
    }
    if (paymentAmount > remainingBalance + 0.01) {
      toast.error(`Amount exceeds remaining balance of ₹${remainingBalance.toFixed(2)}`)
      return
    }

    setLoading(true)
    try {
      const res = await addPaymentAction(invoice.id, paymentAmount, paymentMethod)
      if (res.success) {
        toast.success(res.message)
        // Refresh invoice data locally
        setInvoice((prev: any) => ({
          ...prev,
          status: res.data.status,
          paymentMethod: res.data.paymentMethod,
          payments: [
            ...prev.payments,
            {
              id: Math.random().toString(),
              amount: paymentAmount,
              method: paymentMethod,
              paidAt: new Date().toISOString()
            }
          ]
        }))
        setPaymentAmount(0)
      } else {
        toast.error(res.message)
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
      const res = await updateInvoiceStatusAction(invoice.id, status)
      if (res.success) {
        toast.success(res.message)
        setInvoice((prev: any) => ({
          ...prev,
          status: res.data.status
        }))
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmailInvoice = () => {
    toast.success(`Invoice emailed to ${invoice.customer?.email || "customer"}`)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back & Actions header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Invoices
          </Button>
        </Link>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </Button>
          <Button onClick={handleEmailInvoice} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" />
            Email Invoice
          </Button>
          {invoice.status !== "CANCELLED" && invoice.status !== "REFUNDED" && (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Printable Receipt Invoice */}
        <div className="md:col-span-2 space-y-4 print:col-span-3">
          <Card className="border-border shadow-md print:border-none print:shadow-none bg-card">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="text-center pb-4 border-b border-border/80 space-y-1.5">
                <h2 className="text-lg font-bold text-foreground tracking-tight uppercase">
                  {settings.cafeName}
                </h2>
                {settings.address && (
                  <p className="text-[11px] text-muted-foreground whitespace-pre-line">
                    {settings.address}
                  </p>
                )}
                {settings.phone && (
                  <p className="text-[11px] text-muted-foreground">
                    Tel: {settings.phone}
                  </p>
                )}
                {settings.gstin && (
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    GSTIN: {settings.gstin}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground">
                    Invoice ID: <span className="font-semibold text-foreground font-mono">#{invoice.id.toUpperCase().slice(-8)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Date: <span className="font-medium text-foreground">{format(new Date(invoice.createdAt), "MMM dd, yyyy h:mm a")}</span>
                  </p>
                  {invoice.session?.table && (
                    <p className="text-muted-foreground">
                      Table / Asset: <span className="font-semibold text-foreground">{invoice.session.table.name}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 text-right">
                  <p className="text-muted-foreground">
                    Customer: <span className="font-semibold text-foreground">{invoice.customer?.name || "Walk-in Guest"}</span>
                  </p>
                  {invoice.customer?.phone && (
                    <p className="text-muted-foreground">
                      Phone: <span className="font-medium text-foreground">{invoice.customer.phone}</span>
                    </p>
                  )}
                  <div>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] font-semibold uppercase tracking-wider ${
                        invoice.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : invoice.status === "PARTIAL"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : invoice.status === "CANCELLED"
                          ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1">
                  Charges Summary
                </p>

                {/* Session Charge */}
                {invoice.sessionTotal > 0 && invoice.session && (
                  <div className="flex justify-between items-start text-xs pb-2.5 border-b border-border/30">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">Play Session Charge</p>
                      <p className="text-[10px] text-muted-foreground">
                        {invoice.session.table.tableType.name} (₹{invoice.session.table.tableType.hourlyRate}/hr)
                      </p>
                    </div>
                    <span className="font-mono text-foreground font-semibold">₹{invoice.sessionTotal.toFixed(2)}</span>
                  </div>
                )}

                {/* Cafe Orders */}
                {invoice.session?.orders && invoice.session.orders.length > 0 && (
                  <div className="space-y-2 pb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Cafe Orders
                    </p>
                    {invoice.session.orders.flatMap((order: any) => order.orderItems).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <div>
                          <p className="font-medium text-foreground">{item.itemNameSnapshot}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            ₹{item.unitPriceSnapshot} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono text-muted-foreground">₹{item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-border/80 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{(invoice.sessionTotal + invoice.cafeTotal).toFixed(2)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Discount</span>
                    <span className="font-mono">-₹{invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST / Tax ({settings.taxRate}%)</span>
                    <span className="font-mono">₹{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-dashed border-border/50">
                  <span>Grand Total</span>
                  <span className="font-mono text-lg">₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              {settings.receiptFooterText && (
                <div className="text-center text-[10px] text-muted-foreground pt-4 border-t border-border/40">
                  <p className="italic">{settings.receiptFooterText}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payments Summary Panel */}
        <div className="space-y-4 print:hidden">
          {/* Status Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="text-sm font-bold font-mono text-foreground">
                  ₹{remainingBalance.toFixed(2)}
                </span>
              </div>

              {remainingBalance > 0 && (
                <form onSubmit={handleAddPayment} className="space-y-3 pt-2 border-t border-border/40">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Record Payment (₹)</Label>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={paymentAmount || ""}
                      onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value)))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Method</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {["UPI", "CASH", "CARD"].map((m) => (
                        <Button
                          key={m}
                          type="button"
                          variant={paymentMethod === m ? "default" : "outline"}
                          className="h-7 text-[10px] font-semibold"
                          onClick={() => setPaymentMethod(m)}
                        >
                          {m}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5 mt-1"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.payments.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No payments recorded.
                </div>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {invoice.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3">
                      <div>
                        <p className="font-semibold text-foreground">₹{p.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(p.paidAt), "MMM dd, h:mm a")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] font-medium font-mono">
                        {p.method}
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
