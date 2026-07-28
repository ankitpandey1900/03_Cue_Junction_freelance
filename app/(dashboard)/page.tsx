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
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"

export const dynamic = "force-dynamic"

const SYSTEM_TIMEZONE = "Asia/Kolkata"

export default async function DashboardIndex() {
  // Calculate IST midnight so "today" is always correct regardless of server timezone
  const todayStr = formatInTimeZone(new Date(), SYSTEM_TIMEZONE, "yyyy-MM-dd")
  const todayStart = fromZonedTime(`${todayStr}T00:00:00`, SYSTEM_TIMEZONE)
  const dashboardTime = new Date().getTime()

  const [tables, activeSessions, customers, upcomingBookings, upcomingBookingsCount, todayPaymentsAgg, unpaidInvoicesCount, customerCount] = await Promise.all([
    getTables(),
    getActiveSessions(),
    getCustomers(),
    prisma.booking.findMany({
      where: {
        startTime: { gte: new Date() },
        status: { in: ["CONFIRMED", "PENDING"] }
      },
      include: {
        customer: true,
        table: { include: { tableType: true } },
        tableType: true
      } as any,
      orderBy: { startTime: 'asc' },
      take: 3
    }),
    prisma.booking.count({
      where: {
        startTime: { gte: new Date() },
        status: { in: ["CONFIRMED", "PENDING"] }
      }
    }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: { status: { in: ["UNPAID", "PARTIAL"] }, isArchived: false },
    }),
    prisma.customer.count({ where: { isArchived: false } as any }),
  ])

  const availableTables = tables.filter((table) => table.status === "AVAILABLE").length
  const occupiedTables = tables.length - availableTables
  const todayCollected = todayPaymentsAgg._sum.amount ?? 0
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
        <div className="grid grid-cols-3 sm:flex gap-2 mt-3 sm:mt-0">
          <Link href="/cafe">
            <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs px-2">
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Cafe</span>
            </Button>
          </Link>
          <Link href="/sessions">
            <Button size="sm" className="w-full h-8 gap-1.5 text-xs px-2">
              <Timer className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Sessions</span>
            </Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs px-2">
              <Receipt className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Invoices</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight w-[70%]">Available Tables</p>
              <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Layers className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-emerald-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-500">
              {availableTables} <span className="text-sm text-emerald-500/70">/ {tables.length}</span>
            </p>
            <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{occupiedTables} occupied</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight w-[70%]">Play Sessions</p>
              <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                <Activity className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-amber-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-amber-500">
              {activeSessions.length}
            </p>
            <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{formatCurrency(activeSessionBalance)} balance</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight w-[70%]">Collected</p>
              <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                <Receipt className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-blue-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              {formatCurrency(todayCollected)}
            </p>
            <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{unpaidInvoicesCount} open bills</p>
          </CardContent>
        </Card>

        <Link href="/bookings?date=UPCOMING" className="block transition-transform hover:scale-[1.02] active:scale-95">
          <Card className="bg-card/40 border-border/50 h-full cursor-pointer hover:border-blue-500/30 transition-colors shadow-sm">
            <CardContent className="p-3 sm:p-4 flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight w-[70%]">Bookings</p>
                <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <CalendarCheck className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-blue-500" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold font-mono text-blue-500">
                {upcomingBookingsCount}
              </p>
              <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{customerCount} total customers</p>
              
              <div className="flex-1" />
              
              {upcomingBookings.length > 0 && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-border/50">
                  {(upcomingBookings as any[]).map((b) => (
                    <div key={b.id} className="flex justify-between items-center text-[10px]">
                      <span className="font-medium text-foreground truncate max-w-[60%]">{b.customer.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {formatInTimeZone(new Date(b.startTime), "Asia/Kolkata", "h:mm a")}
                        {" • "}
                        {b.table ? b.table.tableType.name : b.tableType?.name || "Any"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
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
                <ActiveSessionCard key={session.id} session={session} availableTables={tables.filter(t => t.status === "AVAILABLE")} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
