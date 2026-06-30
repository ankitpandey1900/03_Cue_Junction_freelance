import { getTables } from "@/features/tables/services/table.service"
import { getActiveSessions } from "@/features/sessions/services/session.service"
import { TableGrid } from "@/features/tables/components/TableGrid"
import { ActiveSessionCard } from "@/features/sessions/components/ActiveSessionCard"
import { getCustomers } from "@/features/customers/services/customer.service"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Timer, Layers, Activity, CalendarCheck } from "lucide-react"
import prisma from "@/lib/prisma"

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Live Operations Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time map of pool tables, active play timers, and upcoming reservations
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Live Operational Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Tables Card */}
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Available Tables</p>
              <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                {tables.filter(t => t.status === "AVAILABLE").length} / {tables.length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Layers className="h-4.5 w-4.5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions Card */}
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Play Sessions</p>
              <p className="text-2xl font-bold font-mono text-amber-500 mt-1">
                {activeSessions.length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings Card */}
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Upcoming Bookings Today</p>
              <p className="text-2xl font-bold font-mono text-blue-500 mt-1">
                {upcomingBookingsCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CalendarCheck className="h-4.5 w-4.5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                <ActiveSessionCard key={session.id} session={session as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
