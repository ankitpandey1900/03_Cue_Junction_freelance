"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { formatInTimeZone } from "date-fns-tz"
import type { ActivityLogItem, HistoryFilter } from "../services/history.service"
import { getUnifiedTimelineAction } from "../actions/history.actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
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
  Loader2,
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"

interface HistoryFeedProps {
  items: ActivityLogItem[]
  total: number
  page: number
  totalPages: number
  currentFilter: HistoryFilter
  currentEntity?: string
  customFrom?: string
  customTo?: string
  currentQuery?: string
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

const ENTITY_FILTERS = [
  { value: "all", label: "All Events" },
  { value: "session", label: "Sessions" },
  { value: "invoice", label: "Invoices" },
  { value: "booking", label: "Bookings" },
  { value: "customer", label: "Customers" },
  { value: "user", label: "Staff" },
  { value: "menu_item", label: "Cafe Inventory" },
  { value: "settings", label: "Settings" },
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
  // Cafe Inventory
  if (action === "ITEM_CREATED" || action === "ITEM_UPDATED" || action === "STOCK_UPDATE")
    return { label: "Cafe Updated", icon: <Info className="h-3.5 w-3.5"/>, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" }
  if (action === "ITEM_DELETED" || action === "ITEM_DISABLED")
    return { label: "Cafe Removed", icon: <Trash2 className="h-3.5 w-3.5"/>, colorClass: "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400" }
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
    MENU_ITEM: "text-emerald-600 dark:text-emerald-400",
  }
  return map[entityType] ?? "text-muted-foreground"
}

// ─── Timeline Dialog ────────────────────────────────────────────────
function TimelineDialog({ group, open, onClose }: { group: EventGroup | null; open: boolean; onClose: () => void }) {
  const [unifiedItems, setUnifiedItems] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && group) {
      setLoading(true)
      getUnifiedTimelineAction(group.entityId, group.entityType).then((data) => {
        setUnifiedItems(data)
        setLoading(false)
      })
    } else {
      setUnifiedItems(null)
    }
  }, [open, group])

  if (!group) return null

  const { entityType, entityId, latestItem, items } = group
  
  // Use unified items if available, otherwise fallback to local group items immediately for fast UI
  const rawItems = unifiedItems || items
  const timelineItems = [...rawItems].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const isSession = entityType === 'SESSION'
  const isInvoice = entityType === 'INVOICE'
  
  const sessionStart = isSession ? timelineItems.find(i => i.action === 'SESSION_STARTED') : null
  const sessionEnd = isSession ? timelineItems.find(i => i.action === 'SESSION_ENDED') : null
  
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
  
  const invoicePaidEvents = isInvoice ? timelineItems.filter(i => i.action === 'INVOICE_PAID') : []
  
  let invoiceTableNames = ""
  let invoiceCustomerName = ""
  
  if (isInvoice) {
    const checkoutEvent = timelineItems.find(i => i.action === 'CHECKOUT_COMPLETED' || i.action === 'INVOICE_UPDATED' || i.action === 'INVOICE_PAID')
    if (checkoutEvent) {
      try { 
        const m = JSON.parse(checkoutEvent.metadata || '{}')
        if (m.invoiceNumber) invoiceNumber = m.invoiceNumber
        if (m.tableNames) invoiceTableNames = m.tableNames
        if (m.customerName) invoiceCustomerName = m.customerName
      } catch {}
    }
  }

  for (const event of invoicePaidEvents) {
    try { 
      const m = JSON.parse(event.metadata || '{}')
      if (m.amount) totalAmountPaid += Number(m.amount)
      if (m.method) paymentMethods.add(m.method)
      lastReceiver = event.actorName || event.actorEmail || ""
    } catch {}
  }
  
  const hasPayments = invoicePaidEvents.length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 bg-muted/20">
          <DialogTitle className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-foreground text-base">
              {isSession 
                ? `Session Summary: ${tableName}` 
                : isInvoice 
                  ? `Invoice: #${invoiceNumber || 'Pending'}${invoiceCustomerName ? ` - ${invoiceCustomerName}` : ''}${invoiceTableNames ? ` (${invoiceTableNames})` : ''}` 
                  : latestItem.label}
            </span>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2 inline-block" />}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <span className={`${entityColor(entityType)}`}>
                {entityType}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Summary Card for Sessions */}
          {isSession && (
            <div className="bg-background border border-border rounded-lg p-5 space-y-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Played On</p>
                  <p className="text-sm font-semibold text-foreground">
                    {tableName} {tableType ? <span className="text-muted-foreground font-normal text-xs">({tableType})</span> : null}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Started</p>
                  <p className="text-sm font-medium text-foreground">
                    {sessionStart ? formatInTimeZone(new Date(sessionStart.createdAt), "Asia/Kolkata", "hh:mm a") : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Ended</p>
                  <p className="text-sm font-medium text-foreground">
                    {sessionEnd ? formatInTimeZone(new Date(sessionEnd.createdAt), "Asia/Kolkata", "hh:mm a") : 'Active / Unbilled'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Card for Invoices */}
          {isInvoice && hasPayments && (
            <div className="bg-background border border-border rounded-lg p-5 space-y-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Payments Received</p>
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
                const excludedKeys = ['sessionId', 'id', 'invoiceId', 'customerId', 'tableId', 'tableTypeId', 'staffId', 'tableNames', 'customerName', 'invoiceNumber', 'amount', 'method']
                
                const lowerLabel = actionLabel.toLowerCase()
                const lowerDetail = (item.detail || "").toLowerCase()
                
                const formatMetaValue = (k: string, v: any) => {
                  if (['amount', 'discount', 'extraCharges', 'grandTotal', 'sessionTotal', 'cafeTotal', 'taxAmount'].includes(k)) {
                    return `₹${v}`
                  }
                  return String(v)
                }

                const metaEntries = Object.entries(meta).filter(([k, v]) => {
                  if (v === null || v === undefined || v === "") return false
                  if (excludedKeys.includes(k)) return false
                  
                  // Hide redundant text (if the label already says "Shubham", don't show name: Shubham)
                  const vStr = String(v).toLowerCase()
                  if (vStr.length > 3 && (lowerLabel.includes(vStr) || lowerDetail.includes(vStr))) return false
                  
                  return true
                })

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
                        {formatInTimeZone(new Date(item.createdAt), "Asia/Kolkata", "dd MMM, hh:mm a")} • {item.actorName || item.actorEmail}
                      </p>
                      {item.detail && <p className="text-[10px] text-muted-foreground mt-1.5">{item.detail}</p>}
                      
                      {metaEntries.length > 0 && (
                        <div className="mt-2 rounded-lg bg-muted/20 border border-border/40 p-2.5 space-y-1.5 shadow-sm">
                          {metaEntries.map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-medium text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                              <span className="text-[10px] font-bold text-foreground text-right truncate max-w-[200px]">{formatMetaValue(k, v)}</span>
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
export function HistoryFeed({ items, total, page, totalPages, currentFilter, currentEntity, customFrom, customTo, currentQuery }: HistoryFeedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(currentQuery || "")
  const [selectedGroup, setSelectedGroup] = useState<EventGroup | null>(null)
  
  const getEventGroup = (entityId: string, entityType: string): EventGroup => {
    const groupItems = items.filter(i => (i.entityId || i.id) === entityId && i.entityType === entityType)
    return {
      entityId,
      entityType,
      items: groupItems,
      latestItem: groupItems[0] || items[0] // Since items is sorted desc
    }
  }

  // Simplify the flat feed by only showing the LATEST action per entity group
  const feedItems = useMemo(() => {
    const map = new Map<string, ActivityLogItem>()
    const result: ActivityLogItem[] = []
    for (const item of items) {
      const key = `${item.entityType}-${item.entityId || item.id}`
      if (!map.has(key)) {
        map.set(key, item)
        result.push(item) // keep original order (newest first)
      }
    }
    return result
  }, [items])

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); else sp.delete(k) })
    router.push(`/logs?${sp.toString()}`)
  }

  function setFilter(f: HistoryFilter) { navigate({ filter: f, page: "1", from: "", to: "" }) }
  function setEntity(e: string) { navigate({ entity: e, page: "1" }) }
  function setPage(p: number) { navigate({ page: String(p) }) }

  return (
    <div className="space-y-4 pb-10">
      <TimelineDialog group={selectedGroup} open={!!selectedGroup} onClose={() => setSelectedGroup(null)} />

      {/* Filters Bar */}
      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Entity Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <Select value={currentEntity || "all"} onValueChange={(val) => val && setEntity(val)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                <SelectValue placeholder="Filter by type">
                  {ENTITY_FILTERS.find(e => e.value === (currentEntity || 'all'))?.label || "Filter by type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ENTITY_FILTERS.map((e) => (
                  <SelectItem key={e.value} value={e.value} className="text-xs">{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <Select value={currentFilter} onValueChange={(val) => val && setFilter(val as HistoryFilter)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                <SelectValue placeholder="Filter by date">
                  {FILTERS.find(f => f.value === currentFilter)?.label || "Custom Range..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
                <SelectItem value="custom" className="text-xs">Custom Range...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <form 
          className="relative flex-1 w-full lg:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault()
            navigate({ q: searchQuery, page: "1", filter: "all" })
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search history... (Press Enter)"
            className="pl-9 h-9 text-xs w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Custom Date Form (Visible only if filter is custom) */}
        {currentFilter === "custom" && (
          <form
            className="flex items-center gap-2 w-full lg:w-auto"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              navigate({ filter: "custom", from: fd.get("from") as string, to: fd.get("to") as string, page: "1" })
            }}
          >
            <Input name="from" type="date" defaultValue={customFrom}
              className="h-9 w-full sm:w-[130px] text-xs" title="Start Date" />
            <span className="text-xs text-muted-foreground font-medium px-1">to</span>
            <Input name="to" type="date" defaultValue={customTo}
              className="h-9 w-full sm:w-[130px] text-xs" title="End Date" />
            <Button type="submit" size="sm" className="h-9 px-4 text-xs">
              Apply
            </Button>
          </form>
        )}
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

      {/* Flat Data Table */}
      {feedItems.length > 0 && (
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap font-semibold">Timestamp</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Entity</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Action</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold hidden md:table-cell">Details</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Staff</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-right">Sequence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedItems.map((item) => {
                  const { label: actionLabel, icon: actionIcon, colorClass } = getActionMeta(item.action)
                  return (
                    <TableRow key={item.id} className="hover:bg-accent/40 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {formatInTimeZone(new Date(item.createdAt), "Asia/Kolkata", "MMM dd, yyyy")}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatInTimeZone(new Date(item.createdAt), "Asia/Kolkata", "hh:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`hidden sm:flex h-8 w-8 rounded-full items-center justify-center shrink-0 border shadow-sm ${colorClass}`}>
                            {actionIcon}
                          </div>
                          <span className="text-sm font-semibold text-foreground max-w-[150px] sm:max-w-xs md:max-w-md truncate">
                            {item.label}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold ${colorClass}`}>
                          {actionLabel}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden md:table-cell max-w-[250px] truncate">
                        {item.detail ? (
                          <span className="text-xs text-muted-foreground">{item.detail}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">-</span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-primary">
                              {(item.actorName || item.actorEmail)[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {item.actorName || item.actorEmail}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setSelectedGroup(getEventGroup(item.entityId || item.id, item.entityType))}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
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
