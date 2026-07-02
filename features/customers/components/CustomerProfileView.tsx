import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerForm } from "./CustomerForm"
import { CustomerProfile } from "../services/customer.service"
import { formatCurrency, formatInvoiceNumber } from "@/lib/formatters"
import { CalendarClock, CreditCard, Receipt, Timer, Utensils } from "lucide-react"

function statusClass(status: string) {
  if (status === "PAID") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  if (status === "PARTIAL") return "bg-blue-500/10 text-blue-500 border-blue-500/20"
  if (status === "CANCELLED") return "bg-red-500/10 text-red-500 border-red-500/20"
  if (status === "REFUNDED") return "bg-purple-500/10 text-purple-500 border-purple-500/20"
  if (status === "UNPAID") return "bg-amber-500/10 text-amber-500 border-amber-500/20"
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
}

export function CustomerProfileView({ customer }: { customer: CustomerProfile }) {
  const sessionOrders = customer.sessions.flatMap((session) =>
    session.orders.map((order) => ({
      ...order,
      session: {
        table: session.table,
      },
    }))
  )
  const allCafeOrders = Array.from(
    new Map([...customer.orders, ...sessionOrders].map((order) => [order.id, order])).values()
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const paidInvoices = customer.invoices.filter((invoice) => invoice.status === "PAID" || invoice.status === "PARTIAL")
  const unpaidInvoices = customer.invoices.filter((invoice) => invoice.status === "UNPAID" || invoice.status === "PARTIAL")
  const totalPaid = customer.invoices.reduce((sum, invoice) => {
    return sum + invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
  }, 0)
  const totalDue = unpaidInvoices.reduce((sum, invoice) => {
    const paid = invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
    return sum + Math.max(0, invoice.grandTotal - paid)
  }, 0)
  const cafeItems = allCafeOrders.reduce((sum, order) => {
    return sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Paid</p>
            <p className="font-mono text-xl font-bold text-foreground mt-1">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Pending Dues</p>
            <p className="font-mono text-xl font-bold text-amber-500 mt-1">{formatCurrency(totalDue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Sessions</p>
            <p className="font-mono text-xl font-bold text-foreground mt-1">{customer.sessions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Cafe Items</p>
            <p className="font-mono text-xl font-bold text-foreground mt-1">{cafeItems}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.invoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No invoices for this customer yet.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {customer.invoices.map((invoice) => (
                    <Link
                      href={`/invoices/${invoice.id}`}
                      key={invoice.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 p-4 hover:bg-accent/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {formatInvoiceNumber(invoice.invoiceNumber, invoice.id)}
                          </span>
                          <Badge variant="secondary" className={`text-[9px] font-medium ${statusClass(invoice.status)}`}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.createdAt), "MMM d, yyyy h:mm a")}
                          {invoice.session?.table ? ` · ${invoice.session.table.name}` : ""}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(invoice.grandTotal)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Paid {formatCurrency(invoice.payments.reduce((sum, payment) => sum + payment.amount, 0))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.sessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No play sessions recorded.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {customer.sessions.map((session) => (
                    <div key={session.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{session.table.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.table.tableType.name} · {format(new Date(session.startTime), "MMM d, h:mm a")}
                          {session.endTime ? ` - ${format(new Date(session.endTime), "h:mm a")}` : " - Active"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <Badge variant="outline" className="text-[9px] font-medium">
                          {session.status}
                        </Badge>
                        {session.invoice && (
                          <Link href={`/invoices/${session.invoice.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                              <CreditCard className="h-3 w-3" />
                              Bill
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                Cafe Order History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allCafeOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No cafe orders recorded.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {allCafeOrders.map((order) => (
                    <div key={order.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {order.orderItems.map((item) => `${item.itemNameSnapshot} x${item.quantity}`).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                          {order.session?.table ? ` · ${order.session.table.name}` : " · Walk-in"}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(order.total)}</p>
                        <Badge variant="secondary" className="text-[9px] font-medium mt-1">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm initialData={customer} />
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <p>Phone: <span className="text-foreground">{customer.phone}</span></p>
              {customer.email && <p>Email: <span className="text-foreground">{customer.email}</span></p>}
              <p>Customer since: <span className="text-foreground">{format(new Date(customer.createdAt), "MMM d, yyyy")}</span></p>
              <p>Paid invoices: <span className="text-foreground">{paidInvoices.length}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
