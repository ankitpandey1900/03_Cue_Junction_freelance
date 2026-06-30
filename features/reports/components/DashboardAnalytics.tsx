"use client"

import { useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IndianRupee, Timer, Users, ShoppingBag, Award, Flame } from "lucide-react"
import { subDays, subMonths, format } from "date-fns"

interface InvoiceRaw {
  id: string
  sessionTotal: number
  cafeTotal: number
  grandTotal: number
  createdAt: string
  status: string
}

interface DashboardAnalyticsProps {
  stats: {
    totalRevenue: number
    openBalance: number
    openInvoicesCount: number
    paidInvoicesCount: number
    avgOrderValue: number
    activeSessionsCount: number
    occupiedTables: number
    availableTables: number
    totalTables: number
    topSellingItems: { name: string; qty: number; total: number }[]
    bestSellingCategories: { name: string; qty: number }[]
    hourlySales: { hour: string; amount: number }[]
    totalCustomers: number
    dailyRevenue: { date: string; revenue: number }[]
    rawInvoices?: InvoiceRaw[]
  }
}

export function DashboardAnalytics({ stats }: DashboardAnalyticsProps) {
  const [filterPeriod, setFilterPeriod] = useState<"daily" | "weekly" | "monthly">("weekly")
  const handleFilterPeriodChange = (value: "daily" | "weekly" | "monthly" | null) => {
    if (value) {
      setFilterPeriod(value)
    }
  }

  const tableData = [
    { name: "Occupied", value: stats.occupiedTables, color: "#ef4444" },
    { name: "Available", value: stats.availableTables, color: "#10b981" }
  ]

  // Compute aggregated chart data based on selected filter
  const getFilteredChartData = () => {
    const now = new Date()
    const invoicesList = stats.rawInvoices || []
    
    if (filterPeriod === "daily") {
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const d = subDays(now, 6 - i)
        const dateStr = format(d, "MMM dd")
        let sessions = 0
        let cafe = 0
        
        invoicesList.forEach(inv => {
          const invDate = new Date(inv.createdAt)
          if (format(invDate, "yyyy-MM-dd") === format(d, "yyyy-MM-dd") && (inv.status === "PAID" || inv.status === "PARTIAL")) {
            sessions += inv.sessionTotal
            cafe += inv.cafeTotal
          }
        })
        return { name: dateStr, sessions, cafe }
      })
    }
    
    if (filterPeriod === "weekly") {
      // Last 4 weeks
      return Array.from({ length: 4 }, (_, i) => {
        const weekName = `Week ${i + 1}`
        const startDay = subDays(now, (4 - i) * 7)
        const endDay = subDays(now, (3 - i) * 7)
        let sessions = 0
        let cafe = 0
        
        invoicesList.forEach(inv => {
          const invDate = new Date(inv.createdAt)
          if (invDate >= startDay && invDate < endDay && (inv.status === "PAID" || inv.status === "PARTIAL")) {
            sessions += inv.sessionTotal
            cafe += inv.cafeTotal
          }
        })
        return { name: weekName, sessions, cafe }
      })
    }
    
    // Monthly (last 6 months)
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      const dateStr = format(d, "MMM yyyy")
      let sessions = 0
      let cafe = 0
      
      invoicesList.forEach(inv => {
        const invDate = new Date(inv.createdAt)
        if (invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear() && (inv.status === "PAID" || inv.status === "PARTIAL")) {
          sessions += inv.sessionTotal
          cafe += inv.cafeTotal
        }
      })
      return { name: dateStr, sessions, cafe }
    })
  }

  const chartData = getFilteredChartData()

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">30d Collected</p>
                <p className="text-xl font-bold font-mono text-foreground mt-1">₹{stats.totalRevenue.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{stats.paidInvoicesCount} paid/partial bills</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Open Balance</p>
                <p className="text-xl font-bold font-mono text-amber-500 mt-1">₹{stats.openBalance.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{stats.openInvoicesCount} open invoices</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Active Sessions</p>
                <p className="text-xl font-bold font-mono text-foreground mt-1">{stats.activeSessionsCount}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Timer className="h-4 w-4 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Avg Bill Paid</p>
                <p className="text-xl font-bold font-mono text-foreground mt-1">₹{stats.avgOrderValue.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{stats.totalCustomers} customers tracked</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tallymate-Inspired Main Chart Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Sessions vs Cafe Income Area Chart */}
        <Card className="md:col-span-2 bg-card/40 border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Revenue &amp; Sales Trends</CardTitle>
              <p className="text-[10px] text-muted-foreground">Session Play (Green) vs Cafe Food (Yellow)</p>
            </div>
            <Select value={filterPeriod} onValueChange={handleFilterPeriodChange}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-background/50 border-border/50">
                <SelectValue placeholder="Weekly" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", fontSize: "11px", color: "var(--foreground)" }} />
                <Area type="monotone" name="Session Play" dataKey="sessions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
                <Area type="monotone" name="Cafe Food" dataKey="cafe" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorCafe)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Available vs Occupied Pie Chart */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Table Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col justify-center items-center relative">
            {stats.totalTables === 0 ? (
              <p className="text-xs text-muted-foreground">No tables configured.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={tableData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {tableData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Indicators */}
                <div className="flex gap-4 text-xs mt-2 border-t border-border/40 pt-3 w-full justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground text-[10px]">Available ({stats.availableTables})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground text-[10px]">Occupied ({stats.occupiedTables})</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Hourly Sales & Top Selling Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Hourly Sales Bar Chart */}
        <Card className="md:col-span-2 bg-card/40 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Today&apos;s Hourly Sales</CardTitle>
          </CardHeader>
          <CardContent className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hourlySales} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="hour" fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", fontSize: "11px" }} />
                <Bar dataKey="amount" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top items list */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topSellingItems.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No orders recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border/40 text-xs">
                {stats.topSellingItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center p-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                      {index === 1 && <Flame className="h-4 w-4 text-orange-500" />}
                      {index > 1 && <span className="w-4 text-muted-foreground font-mono text-[10px]">{index + 1}.</span>}
                      <span className="font-semibold text-foreground truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{item.qty} units</p>
                      <p className="text-[10px] text-muted-foreground font-mono">₹{item.total.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
