"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import type { ActivityLogItem, HistoryFilter } from "../services/history.service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  InboxIcon,
  PlayCircle,
  PauseCircle,
  StopCircle,
  CheckCircle2,
  UserPlus,
  UserCog,
  Trash2,
  Settings2,
  CalendarPlus,
  CalendarX,
  Receipt,
  RefreshCw,
  LogIn,
  Pencil,
  Eye,
  User,
  Hash,
  Tag,
  Info,
} from "lucide-react"
import { useState, useMemo } from "react"

interface HistoryFeedProps {
  items: ActivityLogItem[]
  total: number
  page: number
  totalPages: number
  currentFilter: HistoryFilter
  customFrom?: string
  customTo?: string
}

export interface EventGroup {
  entityId: string
  entityType: string
  items: ActivityLogItem[]
  latestItem: ActivityLogItem
}

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week",      label: "Last 7 Days" },
  { value: "month",     label: "Last 30 Days" },
  { value: "all",       label: "All Time" },
]

// ─── Action styling & icons ───────────────────────────────────────
function getActionMeta(action: string): { label: string; icon: React.ReactNode; colorClass: string } {
  // Sessions
  if (action === "SESSION_STARTED")
    return { label: "Session Started",   icon: <PlayCircle  className="h-3.5 w-3.5" />, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" }
  if (action === "SESSION_PAUSED")
    return { label: "Session Paused",    icon: <PauseCircle className="h-3.5 w-3.5" />, colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400" }
  if (action === "SESSION_RESUMED")
    return { label: "Session Resumed",   icon: <PlayCircle  className="h-3.5 w-3.5" />, colorClass: "bg-teal-500/10 text-teal-600 border-teal-500/25 dark:text-teal-400" }
  if (action === "SESSION_ENDED")
    return { label: "Session Ended",     icon: <StopCircle  className="h-3.5 w-3.5" />, colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400" }
  if (action === "TABLE_SWITCHED")
    return { label: "Table Switched",    icon: <RefreshCw   className="h-3.5 w-3.5" />, colorClass: "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400" }
  // Invoices / Billing
  if (action === "CHECKOUT_COMPLETED")
    return { label: "Checkout Completed",icon: <CheckCircle2 className="h-3.5 w-3.5"/>, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" }
  if (action === "INVOICE_PAID")
    return { label: "Invoice Paid",      icon: <Receipt      className="h-3.5 w-3.5"/>, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" }
  if (action === "INVOICE_DELETED")
    return { label: "Invoice Deleted",   icon: <Trash2       className="h-3.5 w-3.5"/>, colorClass: "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400" }
  if (action === "INVOICE_UPDATED")
    return { label: "Invoice Updated",   icon: <Pencil       className="h-3.5 w-3.5"/>, colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400" }
  if (action === "INVOICE_CANCELLED")
    return { label: "Invoice Cancelled", icon: <Receipt      className="h-3.5 w-3.5"/>, colorClass: "bg-zinc-500/10 text-zinc-500 border-zinc-500/25" }
  // Customers
  if (action === "CUSTOMER_CREATED")
    return { label: "Customer Added",    icon: <UserPlus     className="h-3.5 w-3.5"/>, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" }
  if (action === "CUSTOMER_UPDATED")
    return { label: "Customer Updated",  icon: <UserCog      className="h-3.5 w-3.5"/>, colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400" }
  if (action === "CUSTOMER_DELETED")
    return { label: "Customer Deleted",  icon: <Trash2       className="h-3.5 w-3.5"/>, colorClass: "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400" }
  // Bookings
  if (action === "BOOKING_CREATED")
    return { label: "Booking Created",   icon: <CalendarPlus className="h-3.5 w-3.5"/>, colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400" }
  if (action === "BOOKING_DELETED")
    return { label: "Booking Deleted",   icon: <CalendarX    className="h-3.5 w-3.5"/>, colorClass: "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400" }
  if (action === "BOOKING_UPDATED")
    return { label: "Booking Updated",   icon: <Pencil       className="h-3.5 w-3.5"/>, colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400" }
  // Staff / Users
  if (action === "STAFF_CREATED")
    return { label: "Staff Created",     icon: <UserPlus     className="h-3.5 w-3.5"/>, colorClass: "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-400" }
  if (action.startsWith("STAFF_"))
    return { label: `Staff ${action.replace("STAFF_", "")}`, icon: <UserCog className="h-3.5 w-3.5"/>, colorClass: "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-400" }
  // Settings
  if (action === "SETTINGS_UPDATED")
    return { label: "Settings Updated",  icon: <Settings2    className="h-3.5 w-3.5"/>, colorClass: "bg-orange-500/10 text-orange-600 border-orange-500/25 dark:text-orange-400" }
  // Fallback
  return { label: action.replace(/_/g, " "), icon: <LogIn className="h-3.5 w-3.5"/>, colorClass: "bg-muted text-muted-foreground border-border" }
}

// ─── Entity type pill ─────────────────────────────────────────────
function entityColor(entityType: string) {
  const map: Record<string, string> = {
    SESSION:  "text-blue-600 dark:text-blue-400",
    INVOICE:  "text-emerald-600 dark:text-emerald-400",
    CUSTOMER: "text-violet-600 dark:text-violet-400",
    BOOKING:  "text-amber-600 dark:text-amber-400",
    USER:     "text-rose-600 dark:text-rose-400",
    SETTINGS: "text-orange-600 dark:text-orange-400",
    SESSION_FLOW: "text-blue-600 dark:text-blue-400",
  }
  return map[entityType] ?? "text-muted-foreground"
}

// ─── Timeline Dialog ────────────────────────────────────────────────
function TimelineDialog({ group, open, onClose }: { group: EventGroup | null; open: boolean; onClose: () => void }) {
  if (!group) return null

  const { entityType, entityId, latestItem, items } = group
  const timelineItems = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // If this is a Session Flow, compute summary stats
  const isSessionFlow = entityType === 'SESSION_FLOW'
  const sessionStart = isSessionFlow ? timelineItems.find(i => i.action === 'SESSION_STARTED') : null
  const sessionEnd = isSessionFlow ? timelineItems.find(i => i.action === 'SESSION_ENDED') : null
  
  const invoicePaidEvents = isSessionFlow ? timelineItems.filter(i => i.action === 'INVOICE_PAID') : []
  
  let tableName = "Unknown Table"
  let tableType = ""
  let totalAmountPaid = 0
  const paymentMethods = new Set<string>()
  let invoiceNumber = null
  let lastReceiver = ""
  
  if (sessionStart) {
    try { 
      const m = JSON.parse(sessionStart.metadata || '{}'); 
      if (m.tableName) tableName = m.tableName;
      if (m.tableType) tableType = m.tableType;
    } catch {}
  }
  
  for (const event of invoicePaidEvents) {
    try { 
      const m = JSON.parse(event.metadata || '{}')
      if (m.amount) totalAmountPaid += Number(m.amount)
      if (m.method) paymentMethods.add(m.method)
      if (m.invoiceNumber) invoiceNumber = m.invoiceNumber
      lastReceiver = event.actorName || event.actorEmail || ""
    } catch {}
  }
  
  const hasPayments = invoicePaidEvents.length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 bg-muted/20">
          <DialogTitle className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-foreground text-base">{isSessionFlow ? `Session Summary: ${tableName}` : latestItem.label}</span>
            <div className="flex items-center gap-2 text-xs font-normal">
              <span className={`${entityColor(entityType)}`}>
                {isSessionFlow ? 'SESSION' : entityType}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Summary Card for Sessions */}
          {isSessionFlow && (
            <div className="bg-background border border-border rounded-lg p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Played On</p>
                  <p className="text-sm font-semibold text-foreground">
                    {tableName} {tableType ? <span className="text-muted-foreground font-normal text-xs">({tableType})</span> : null}
                  </p>
                </div>
                {invoiceNumber && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Invoice</p>
                    <p className="text-sm font-semibold text-foreground">#{invoiceNumber}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Started</p>
                  <p className="text-sm font-medium text-foreground">
                    {sessionStart ? format(new Date(sessionStart.createdAt), "hh:mm a") : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Ended</p>
                  <p className="text-sm font-medium text-foreground">
                    {sessionEnd ? format(new Date(sessionEnd.createdAt), "hh:mm a") : (hasPayments ? 'Checked Out' : 'Active')}
                  </p>
                </div>
              </div>

              {hasPayments && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Payment Received</p>
                    <span className="text-xs font-medium text-muted-foreground">
                      via {Array.from(paymentMethods).join(", ") || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <p className="text-xl font-bold text-foreground">₹{totalAmountPaid}</p>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Received by</p>
                      <p className="text-xs font-medium text-foreground">{lastReceiver}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chronological Timeline */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-5">
              Event Timeline
            </h4>
            <div className="space-y-4">
              {timelineItems.map((item, idx) => {
                const { label: actionLabel, icon: actionIcon, colorClass } = getActionMeta(item.action)
                
                let meta: Record<string, any> = {}
                try { if (item.metadata) meta = JSON.parse(item.metadata) } catch { /* ignore */ }
                
                // Exclude system IDs from being displayed in the timeline UI
                const excludedKeys = ['sessionId', 'id', 'invoiceId', 'customerId', 'tableId']
                const metaEntries = Object.entries(meta).filter(([k, v]) => 
                  v !== null && v !== undefined && v !== "" && !excludedKeys.includes(k)
                )

                return (
                  <div key={item.id} className="relative flex gap-3">
                    {/* line connecting items */}
                    {idx !== timelineItems.length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-[-16px] w-[2px] bg-border/60" />
                    )}
                    <div className={`shrink-0 h-7 w-7 rounded-full border flex items-center justify-center bg-background z-10 shadow-sm ${colorClass}`}>
                      {actionIcon}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-xs font-bold text-foreground leading-none mb-1">{actionLabel}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {format(new Date(item.createdAt), "dd MMM, hh:mm a")} • {item.actorName || item.actorEmail}
                      </p>
                      {item.detail && <p className="text-[10px] text-muted-foreground mt-1.5">{item.detail}</p>}
                      
                      {metaEntries.length > 0 && (
                        <div className="mt-2 rounded-lg bg-muted/20 border border-border/40 p-2.5 space-y-1.5 shadow-sm">
                          {metaEntries.map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-medium text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                              <span className="text-[10px] font-bold text-foreground text-right truncate max-w-[200px]">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Feed ────────────────────────────────────────────────────
export function HistoryFeed({ items, total, page, totalPages, currentFilter, customFrom, customTo }: HistoryFeedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedGroup, setSelectedGroup] = useState<EventGroup | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["TODAY", "YESTERDAY"]))
  
  const groupedHistory = useMemo(() => {
    const map = new Map<string, EventGroup>()
    
    // 1. Group items by entityId into EventGroup
    for (const item of items) {
      let meta: Record<string, any> = {}
      try { if (item.metadata) meta = JSON.parse(item.metadata) } catch {}
      
      const sessionId = meta.sessionId || (item.entityType === 'SESSION' ? item.entityId : null)
      const key = sessionId ? `FLOW-${sessionId}` : item.entityId ? `${item.entityType}-${item.entityId}` : item.id

      if (!map.has(key)) {
        const group: EventGroup = { 
          entityId: sessionId || item.entityId || item.id, 
          entityType: sessionId ? 'SESSION_FLOW' : item.entityType, 
          items: [], 
          latestItem: item 
        }
        map.set(key, group)
      }
      map.get(key)!.items.push(item)
    }

    const groups = Array.from(map.values()).sort(
      (a, b) => new Date(b.latestItem.createdAt).getTime() - new Date(a.latestItem.createdAt).getTime()
    )

    // 2. Group into Month > Date
    type HistoryNode = {
      [monthStr: string]: {
        count: number;
        dates: {
          [dateLabel: string]: {
            count: number;
            groups: EventGroup[];
          }
        }
      }
    }

    const data: HistoryNode = {}
    const todayStr = format(new Date(), "yyyy-MM-dd")
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = format(yesterdayDate, "yyyy-MM-dd")

    for (const g of groups) {
      const d = new Date(g.latestItem.createdAt)
      const monthStr = format(d, "MMMM yyyy").toUpperCase()
      
      const exactDateStr = format(d, "yyyy-MM-dd")
      let dateLabel = format(d, "EEE, MMM d, yyyy").toUpperCase()
      if (exactDateStr === todayStr) dateLabel = "TODAY"
      else if (exactDateStr === yesterdayStr) dateLabel = "YESTERDAY"

      if (!data[monthStr]) data[monthStr] = { count: 0, dates: {} }
      if (!data[monthStr].dates[dateLabel]) data[monthStr].dates[dateLabel] = { count: 0, groups: [] }
      
      data[monthStr].count += 1
      data[monthStr].dates[dateLabel].count += 1
      data[monthStr].dates[dateLabel].groups.push(g)
    }

    return data
  }, [items])

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); else sp.delete(k) })
    router.push(`/logs?${sp.toString()}`)
  }

  function setFilter(f: HistoryFilter) { navigate({ filter: f, page: "1", from: "", to: "" }) }
  function setPage(p: number) { navigate({ page: String(p) }) }

  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  // If a custom filter is active, auto-expand everything for visibility
  const isCustomFilter = currentFilter !== "all" && currentFilter !== "month" && currentFilter !== "week"
  const isExpanded = (nodeId: string) => isCustomFilter || expandedNodes.has(nodeId)

  const renderGroupHeader = (nodeId: string, label: string, count: number, depth: number) => {
    const expanded = isExpanded(nodeId)
    return (
      <div 
        onClick={(e) => toggleNode(nodeId, e)} 
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-accent/40 border-b border-border/40 transition-colors select-none ${
          depth === 0 ? "bg-card/50" : "bg-card/30 pl-6"
        }`}
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          <span className={`uppercase tracking-wider ${
            depth === 0 ? "font-bold text-base text-foreground" : "font-bold text-sm text-foreground"
          }`}>
            {label}
          </span>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono px-2 py-0.5">
          {count} Events
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-10">
      <TimelineDialog group={selectedGroup} open={!!selectedGroup} onClose={() => setSelectedGroup(null)} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                currentFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form
          className="flex items-center gap-2 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            navigate({ filter: "custom", from: fd.get("from") as string, to: fd.get("to") as string, page: "1" })
          }}
        >
          <input name="from" type="date" defaultValue={customFrom}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary" />
          <span className="text-xs text-muted-foreground">to</span>
          <input name="to" type="date" defaultValue={customTo}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary" />
          <button type="submit"
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition">
            Apply
          </button>
        </form>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{items.length}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> events
      </p>

      {/* Empty */}
      {items.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/50">
          <InboxIcon className="h-9 w-9 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No activity found</p>
          <p className="text-xs text-muted-foreground mt-1">Try changing the date filter.</p>
        </div>
      )}

      {/* Hierarchical Accordion Feed */}
      {items.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/20 overflow-hidden shadow-sm">
          {Object.entries(groupedHistory).map(([monthStr, monthData]) => (
            <div key={monthStr} className="group-month">
              {renderGroupHeader(monthStr, monthStr, monthData.count, 0)}

              {isExpanded(monthStr) && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  {Object.entries(monthData.dates).map(([dateLabel, dateData]) => {
                    const dateId = `${monthStr}-${dateLabel}`
                    return (
                      <div key={dateId} className="group-date border-l-2 border-border/30 ml-2">
                        {renderGroupHeader(dateId, dateLabel, dateData.count, 1)}

                        {isExpanded(dateId) && (
                          <div className="animate-in slide-in-from-top-2 duration-200 bg-background/50 divide-y divide-border/40">
                            {dateData.groups.map((group) => {
                              const item = group.latestItem
                              const count = group.items.length
                              const { label: actionLabel, icon: actionIcon, colorClass } = getActionMeta(item.action)
                              
                              return (
                                <div
                                  key={group.entityId}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-accent/40 transition-colors pl-8 sm:pl-12 gap-3 cursor-pointer"
                                  onClick={() => setSelectedGroup(group)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`hidden sm:flex h-10 w-10 rounded-full items-center justify-center shrink-0 border shadow-sm ${colorClass}`}>
                                      {actionIcon}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
                                          {item.label}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                                          {format(new Date(item.createdAt), "hh:mm a")}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 uppercase tracking-wider font-bold ${colorClass}`}>
                                          {actionLabel}
                                        </Badge>
                                        {item.detail && (
                                          <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                            {item.detail}
                                          </span>
                                        )}
                                        {count > 1 && (
                                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                                            +{count - 1} event{count > 2 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 self-start sm:self-center mt-2 sm:mt-0 ml-12 sm:ml-0">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                      <span className="text-[10px] font-bold text-primary">
                                        {(item.actorName || item.actorEmail)[0]?.toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                                      {item.actorName || item.actorEmail}
                                    </span>
                                    <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors ml-2" />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1 text-xs" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1 text-xs" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
