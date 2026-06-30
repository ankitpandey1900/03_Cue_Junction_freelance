import { getTables } from "@/features/tables/services/table.service"
import { getActiveSessions } from "@/features/sessions/services/session.service"
import { TableGrid } from "@/features/tables/components/TableGrid"
import { ActiveSessionCard } from "@/features/sessions/components/ActiveSessionCard"
import { getCustomers } from "@/features/customers/services/customer.service"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Timer, Layers, Activity, CalendarCheck, Receipt, AlertTriangle } from "lucide-react"
import prisma from "@/lib/prisma"
import { formatCurrency } from "@/lib/formatters"

export const dynamic = "force-dynamic"

export default async function DashboardIndex() {
  const [tables, activeSessions, customers] = await Promise.all([
    getTables(),
    getActiveSessions(),
    getCustomers(),
  ])

  // Count active or confirmed bookings for today
  const upcomingBookingsCount = await prisma.booking.count({
    where: {
      startTime: { gte: new Date() },
      status: { in: ["CONFIRMED", "PENDING"] }
    }
  })
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const dashboardTime = new Date().getTime()

  const [todayPaidInvoices, unpaidInvoicesCount] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: todayStart },
        status: { in: ["PAID", "PARTIAL"] },
      },
      include: { payments: true },
    }),
    prisma.invoice.count({
      where: {
        status: { in: ["UNPAID", "PARTIAL"] },
      },
    }),
  ])

  const availableTables = tables.filter((table) => table.status === "AVAILABLE").length
  const occupiedTables = tables.length - availableTables
  const todayCollected = todayPaidInvoices.reduce((sum, invoice) => {
    return sum + invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
  }, 0)
  const activeSessionBalance = activeSessions.reduce((sum, session) => {
    const tableType = session.table.tableType
    const elapsedMinutes = Math.max(1, Math.floor((dashboardTime - new Date(session.startTime).getTime()) / 60000))
    let playCharge = 0

    if (tableType.fixedRate != null && tableType.fixedDuration != null && tableType.fixedDuration > 0) {
      if (elapsedMinutes <= tableType.fixedDuration) {
        playCharge = tableType.fixedRate
      } else {
        playCharge = tableType.fixedRate + ((elapsedMinutes - tableType.fixedDuration) / 60) * (tableType.overtimeHourlyRate ?? tableType.hourlyRate)
      }
    } else {
      playCharge = (elapsedMinutes / 60) * tableType.hourlyRate
    }

    return sum + Math.max(playCharge, tableType.minimumCharge) + session.orders.reduce((orderSum, order) => orderSum + order.total, 0)
  }, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Live Operations Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Shift view for tables, running balances, invoices, and customer activity
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Link href="/pos">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ShoppingCart className="h-3.5 w-3.5" />
              POS
            </Button>
          </Link>
          <Link href="/sessions">
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Timer className="h-3.5 w-3.5" />
              Sessions
            </Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs w-full sm:w-auto">
              <Receipt className="h-3.5 w-3.5" />
              Invoices
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Available Tables</p>
              <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                {availableTables} / {tables.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{occupiedTables} currently occupied</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Layers className="h-4.5 w-4.5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Play Sessions</p>
              <p className="text-2xl font-bold font-mono text-amber-500 mt-1">
                {activeSessions.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{formatCurrency(activeSessionBalance)} running balance</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Today Collected</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">
                {formatCurrency(todayCollected)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{unpaidInvoicesCount} invoices need attention</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Receipt className="h-4.5 w-4.5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Upcoming Bookings</p>
              <p className="text-2xl font-bold font-mono text-blue-500 mt-1">
                {upcomingBookingsCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{customers.length} customers on file</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CalendarCheck className="h-4.5 w-4.5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {unpaidInvoicesCount > 0 && (
        <Link
          href="/invoices"
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm hover:bg-amber-500/10 transition-colors"
        >
          <span className="flex items-center gap-2 text-amber-500 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {unpaidInvoicesCount} invoice{unpaidInvoicesCount === 1 ? "" : "s"} still open
          </span>
          <span className="text-xs text-muted-foreground">Review billing</span>
        </Link>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        <div className="xl:col-span-2 space-y-3">
          <h2 className="text-sm font-medium text-foreground">Table Map</h2>
          <TableGrid tables={tables} customers={customers} />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Active Sessions
            {activeSessions.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({activeSessions.length})
              </span>
            )}
          </h2>
          {activeSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center bg-card/10">
              <Timer className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No active sessions</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {activeSessions.map((session) => (
                <ActiveSessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
