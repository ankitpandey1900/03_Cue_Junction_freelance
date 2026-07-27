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
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, Timer, Users, ShoppingBag, Award, Flame, Receipt, WalletCards, CircleAlert, Calendar, LineChartIcon, PieChartIcon } from "lucide-react"
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

const moneyTick = (value: number) => {
  if (value >= 1000) {
    return `Rs ${(value / 1000).toFixed(value % 1000 !== 0 ? 1 : 0)}k`
  }
  return `Rs ${value}`
}

export function DashboardAnalytics({ stats }: DashboardAnalyticsProps) {
  const tableData = [
    { name: "Available", value: stats.availableTables, color: "#10b981" },
    { name: "Occupied", value: stats.occupiedTables, color: "#ef4444" },
    { name: "Reserved", value: stats.reservedTables, color: "#3b82f6" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-5">
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
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4 text-blue-500" />
                  Sales Trend
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-1">Play, cafe, and actual collected money for the selected dates.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-6 pl-0 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailySales} margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cafeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  stroke="var(--muted-foreground)" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={12}
                />
                <YAxis 
                  width={55}
                  fontSize={10} 
                  stroke="var(--muted-foreground)" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={moneyTick} 
                  tickMargin={12}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border/60 bg-card/90 backdrop-blur-md p-3 shadow-lg">
                          <p className="font-bold text-xs mb-2 border-b border-border/50 pb-1">{label}</p>
                          <div className="space-y-1.5">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-muted-foreground capitalize">{entry.name}</span>
                                </div>
                                <span className="font-mono font-bold text-foreground">{formatCurrency(Number(entry.value))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '10px' }}
                />
                <Area type="monotone" name="Play Revenue" dataKey="sessions" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#sessionsFill)" activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }} />
                <Area type="monotone" name="Cafe Revenue" dataKey="cafe" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#cafeFill)" activeDot={{ r: 4, strokeWidth: 0, fill: '#f59e0b' }} />
                <Area type="monotone" name="Total Collected" dataKey="collected" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#collectedFill)" activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-purple-500" />
              Table Occupancy
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1">{stats.activeSessionsCount} live sessions right now</p>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center items-center pt-4">
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
        <div className="space-y-4 flex flex-col h-full">
          <Card className="bg-card/40 border-border/50 flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Top Cafe Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {stats.topSellingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-xs text-muted-foreground opacity-70">
                  <span className="mb-2 text-2xl">🍽️</span>
                  No cafe orders in this range.
                </div>
              ) : (
                <div className="divide-y divide-border/20 text-xs">
                  {stats.topSellingItems.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center p-3.5 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-4 text-center font-mono font-bold text-xs ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-zinc-400' :
                          index === 2 ? 'text-orange-500' :
                          'text-muted-foreground/60'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-foreground truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                        <span className="font-semibold text-foreground text-xs">{item.qty} units</span>
                        <span className="text-[10px] text-muted-foreground">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                Gaming Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {stats.gamingRevenueByTableType.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-xs text-muted-foreground opacity-70">
                  <span className="mb-2 text-2xl">🎱</span>
                  No gaming sessions in this range.
                </div>
              ) : (
                <div className="divide-y divide-border/20 text-xs p-2">
                  {stats.gamingRevenueByTableType.map((type, index) => {
                    const maxRev = Math.max(...stats.gamingRevenueByTableType.map(t => t.totalRevenue), 1);
                    const widthPct = Math.max(2, (type.totalRevenue / maxRev) * 100);
                    return (
                      <div key={type.id} className="p-2 hover:bg-muted/10 transition-colors rounded-lg mb-1">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-2 w-2 rounded-full bg-primary/60 shrink-0"></div>
                            <span className="font-medium text-foreground text-sm truncate">{type.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">{type.sessionCount} plays</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono font-semibold text-[13px] text-foreground">{formatCurrency(type.totalRevenue)}</p>
                          </div>
                        </div>
                        <div className="pl-4 pr-1">
                          <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${widthPct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
    <Card className="bg-card/40 border-border/50 hover:bg-card/60 transition-colors">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className="text-muted-foreground/60">{icon}</div>
        </div>
        <div>
          <p className={`text-2xl font-bold font-mono tracking-tight ${muted ? "text-muted-foreground/60" : "text-foreground"}`}>{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{helper}</p>
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
  const maxStaffAmount = Math.max(...paymentsByStaff.map((s) => s.totalAmount), 1)

  return (
    <Card className="col-span-1 lg:col-span-2 bg-card/40 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-500" />
          Payments Received By Staff
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {paymentsByStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center text-xs text-muted-foreground opacity-70">
             <span className="mb-2 text-2xl">👥</span>
             No payments collected by staff in this range.
          </div>
        ) : (
          <div className="divide-y divide-border/20 text-xs">
            {paymentsByStaff.map((staff, index) => {
              const widthPct = Math.max(1, (staff.totalAmount / maxStaffAmount) * 100)
              const initials = staff.name.substring(0, 2).toUpperCase()
              
              return (
                <div key={staff.id} className="p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-accent border border-border/40 text-muted-foreground flex items-center justify-center shrink-0 font-bold text-[10px] tracking-wider">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm truncate">{staff.name}</p>
                        <p className="text-[10px] text-muted-foreground">{staff.count} payments processed</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-semibold text-[15px] text-foreground">{formatCurrency(staff.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="pl-11 pr-2">
                    <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                       <div className="h-full bg-primary/60 rounded-full" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
