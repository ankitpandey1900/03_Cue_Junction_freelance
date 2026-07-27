import { formatInTimeZone } from "date-fns-tz"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CustomerForm } from "./CustomerForm"
import { CustomerProfile } from "../services/customer.service"
import { formatCurrency, formatInvoiceNumber } from "@/lib/formatters"
import { CreditCard, Edit2, Mail, Phone, CalendarDays } from "lucide-react"

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

  // Get initials for avatar
  const initials = customer.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="space-y-8">
      {/* 1. Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 border rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {customer.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {formatInTimeZone(new Date(customer.createdAt), "Asia/Kolkata", "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>

        <Dialog>
          <DialogTrigger className={buttonVariants({ variant: "outline", className: "shrink-0" })}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm initialData={customer} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Total Paid</p>
            <p className="font-mono text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50 border-t-4 border-t-amber-500">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Pending Dues</p>
            <p className="font-mono text-2xl font-bold text-amber-500">{formatCurrency(totalDue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Sessions Played</p>
            <p className="font-mono text-2xl font-bold text-foreground">{customer.sessions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Cafe Items Ordered</p>
            <p className="font-mono text-2xl font-bold text-foreground">{cafeItems}</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. History Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-card">
          <TabsTrigger value="invoices">Invoices ({customer.invoices.length})</TabsTrigger>
          <TabsTrigger value="sessions">Sessions ({customer.sessions.length})</TabsTrigger>
          <TabsTrigger value="cafe">Cafe Orders ({allCafeOrders.length})</TabsTrigger>
        </TabsList>
        
        {/* INVOICES TAB */}
        <TabsContent value="invoices">
          <div className="border rounded-xl bg-card overflow-hidden">
            {customer.invoices.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No invoices history found.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {customer.invoices.map((invoice) => (
                  <Link
                    href={`/invoices/${invoice.id}`}
                    key={invoice.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-accent/40 transition-colors group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          {formatInvoiceNumber(invoice.invoiceNumber, invoice.id)}
                        </span>
                        <Badge variant="secondary" className={`text-[10px] font-bold ${statusClass(invoice.status)}`}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {formatInTimeZone(new Date(invoice.createdAt), "Asia/Kolkata", "MMM d, yyyy · h:mm a")}
                        {invoice.sessions?.[0]?.table ? ` · ${invoice.sessions[0].table.name}` : ""}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-mono text-lg font-bold text-foreground">{formatCurrency(invoice.grandTotal)}</p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Paid: {formatCurrency(invoice.payments.reduce((sum, payment) => sum + payment.amount, 0))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SESSIONS TAB */}
        <TabsContent value="sessions">
          <div className="border rounded-xl bg-card overflow-hidden">
            {customer.sessions.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No play sessions recorded.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {customer.sessions.map((session) => (
                  <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                    <div className="space-y-1">
                      <p className="text-base font-bold text-foreground">{session.table.name}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {session.table.tableType.name} · {formatInTimeZone(new Date(session.startTime), "Asia/Kolkata", "MMM d, h:mm a")}
                        {session.endTime ? ` to ${formatInTimeZone(new Date(session.endTime), "Asia/Kolkata", "h:mm a")}` : " - Active"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <Badge variant="outline" className="text-[10px] font-bold tracking-wide">
                        {session.status}
                      </Badge>
                      {session.invoice && (
                        <Link href={`/invoices/${session.invoice.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5">
                            <CreditCard className="h-3.5 w-3.5" />
                            View Bill
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* CAFE ORDERS TAB */}
        <TabsContent value="cafe">
          <div className="border rounded-xl bg-card overflow-hidden">
            {allCafeOrders.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No cafe orders recorded.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {allCafeOrders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                    <div className="space-y-1.5">
                      <p className="text-base font-bold text-foreground leading-tight">
                        {order.orderItems.map((item) => `${item.itemNameSnapshot} x${item.quantity}`).join(", ")}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatInTimeZone(new Date(order.createdAt), "Asia/Kolkata", "MMM d, yyyy · h:mm a")}
                        {order.session?.table ? ` · Ordered at ${order.session.table.name}` : " · Walk-in Order"}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-mono text-lg font-bold text-foreground">{formatCurrency(order.total)}</p>
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-wide mt-1">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
