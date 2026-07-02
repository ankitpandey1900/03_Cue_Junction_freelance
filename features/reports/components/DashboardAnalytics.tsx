"use client"

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
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, Timer, Users, ShoppingBag, Award, Flame, Receipt, WalletCards, CircleAlert, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

interface DashboardAnalyticsProps {
  stats: {
    range: { from: string; to: string; label: string }
    collectedRevenue: number
    billedRevenue: number
    sessionRevenue: number
    cafeRevenue: number
    discountTotal: number
    pendingCollection: number
    collectionRate: number
    invoicesCount: number
    paidInvoicesCount: number
    partialInvoicesCount: number
    unpaidInvoicesCount: number
    avgBillValue: number
    activeSessionsCount: number
    occupiedTables: number
    reservedTables: number
    availableTables: number
    totalTables: number
    topSellingItems: { name: string; qty: number; total: number }[]
    bestSellingCategories: { name: string; qty: number }[]
    hourlySales: { hour: string; amount: number }[]
    totalCustomers: number
    dailySales: { name: string; sessions: number; cafe: number; collected: number }[]
    paymentsByStaff: { id: string; name: string; totalAmount: number; count: number }[]
    paymentsList: {
      id: string;
      amount: number;
      method: string;
      paidAt: Date;
      invoiceId: string;
      invoiceNumber: string;
      receivedByName: string;
      receivedById: string | null;
    }[]
    gamingRevenueByTableType: { id: string; name: string; totalRevenue: number; sessionCount: number }[]
  }
}

const moneyTick = (value: number) => `Rs ${value}`

export function DashboardAnalytics({ stats }: DashboardAnalyticsProps) {
  const tableData = [
    { name: "Available", value: stats.availableTables, color: "#10b981" },
    { name: "Occupied", value: stats.occupiedTables, color: "#ef4444" },
    { name: "Reserved", value: stats.reservedTables, color: "#3b82f6" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-card/45 backdrop-blur-md p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Report Date Range</p>
              <p className="text-[11px] font-semibold text-muted-foreground/95 font-mono">{stats.range.label}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-[11px] sm:min-w-[380px]">
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-2 flex flex-col justify-center">
              <p className="font-mono text-sm font-extrabold text-blue-400">{stats.invoicesCount}</p>
              <p className="text-[10px] text-blue-500/80 font-bold uppercase tracking-wider mt-0.5">Bills</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2 flex flex-col justify-center">
              <p className="font-mono text-sm font-extrabold text-emerald-400">{stats.collectionRate.toFixed(0)}%</p>
              <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider mt-0.5">Collected</p>
            </div>
            <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-2 flex flex-col justify-center">
              <p className="font-mono text-sm font-extrabold text-indigo-400">{stats.totalCustomers}</p>
              <p className="text-[10px] text-indigo-500/80 font-bold uppercase tracking-wider mt-0.5">Customers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Money Collected"
          value={formatCurrency(stats.collectedRevenue)}
          helper={`${stats.paidInvoicesCount} paid, ${stats.partialInvoicesCount} partial`}
          icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
        />
        <MetricCard
          label="Total Billing"
          value={formatCurrency(stats.billedRevenue)}
          helper={`${formatCurrency(stats.sessionRevenue)} play + ${formatCurrency(stats.cafeRevenue)} cafe`}
          icon={<Receipt className="h-4 w-4 text-blue-500" />}
        />
        <MetricCard
          label="Pending Collection"
          value={formatCurrency(stats.pendingCollection)}
          helper={`${stats.unpaidInvoicesCount + stats.partialInvoicesCount} unpaid or partial bills`}
          icon={<CircleAlert className="h-4 w-4 text-amber-500" />}
          muted={stats.pendingCollection === 0}
        />
        <MetricCard
          label="Average Bill"
          value={formatCurrency(stats.avgBillValue)}
          helper={`${formatCurrency(stats.discountTotal)} discounts in range`}
          icon={<WalletCards className="h-4 w-4 text-purple-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card/40 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Sales Trend</CardTitle>
            <p className="text-[10px] text-muted-foreground">Play, cafe, and actual collected money for the selected dates.</p>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailySales} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cafeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} tickFormatter={moneyTick} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", fontSize: "11px", color: "var(--foreground)" }} formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" name="Play" dataKey="sessions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#sessionsFill)" />
                <Area type="monotone" name="Cafe" dataKey="cafe" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#cafeFill)" />
                <Area type="monotone" name="Collected" dataKey="collected" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#collectedFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Table Occupancy</CardTitle>
            <p className="text-[10px] text-muted-foreground">{stats.activeSessionsCount} live sessions right now</p>
          </CardHeader>
          <CardContent className="h-[280px] flex flex-col justify-center items-center">
            {stats.totalTables === 0 ? (
              <p className="text-xs text-muted-foreground">No tables configured.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="78%">
                  <PieChart>
                    <Pie data={tableData} cx="50%" cy="50%" innerRadius={54} outerRadius={76} paddingAngle={3} dataKey="value">
                      {tableData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 text-[10px] w-full">
                  <LegendDot color="bg-emerald-500" label={`Available ${stats.availableTables}`} />
                  <LegendDot color="bg-destructive" label={`Occupied ${stats.occupiedTables}`} />
                  <LegendDot color="bg-blue-500" label={`Reserved ${stats.reservedTables}`} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Staff Payments Table (takes 2 columns) */}
        <div className="lg:col-span-2">
          <StaffPaymentsTable paymentsList={stats.paymentsList} paymentsByStaff={stats.paymentsByStaff} />
        </div>

        {/* Right Column: Top Cafe Items + Gaming Revenue stacked (takes 1 column) */}
        <div className="space-y-4">
          <Card className="bg-card/40 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Cafe Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.topSellingItems.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">No cafe orders in this range.</div>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {stats.topSellingItems.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500 shrink-0" />}
                        {index === 1 && <Flame className="h-4 w-4 text-orange-500 shrink-0" />}
                        {index > 1 && <span className="w-4 text-muted-foreground font-mono text-[10px] shrink-0">{index + 1}.</span>}
                        <span className="font-semibold text-foreground truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-foreground">{item.qty} units</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Gaming Revenue by Table Type</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.gamingRevenueByTableType.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">No gaming sessions in this range.</div>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {stats.gamingRevenueByTableType.map((type, index) => (
                    <div key={type.id} className="flex justify-between items-center p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-foreground truncate">{type.name}</span>
                        <span className="text-[10px] text-muted-foreground">({type.sessionCount} sessions)</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-foreground">{formatCurrency(type.totalRevenue)}</p>
                      </div>
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

function MetricCard({
  label,
  value,
  helper,
  icon,
  muted = false,
}: {
  label: string
  value: string
  helper: string
  icon: React.ReactNode
  muted?: boolean
}) {
  return (
    <Card className="bg-card/40 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
            <p className={`text-xl font-bold font-mono mt-1 ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">{helper}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-md bg-accent/40 p-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

function StaffPaymentsTable({ paymentsList, paymentsByStaff }: { paymentsList: DashboardAnalyticsProps["stats"]["paymentsList"], paymentsByStaff: DashboardAnalyticsProps["stats"]["paymentsByStaff"] }) {
  // Use React state or just render directly
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Payments Received By Staff</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {paymentsByStaff.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">No payments in this range.</div>
        ) : (
          <div className="divide-y divide-border/40 text-xs">
            {paymentsByStaff.map((staff, index) => (
              <div key={staff.id} className="flex justify-between items-center p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-foreground truncate">{staff.name}</span>
                  <span className="text-[10px] text-muted-foreground">({staff.count} payments)</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium text-foreground">{formatCurrency(staff.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
