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
import { useState } from "react"

interface HistoryFeedProps {
  items: ActivityLogItem[]
  total: number
  page: number
  totalPages: number
  currentFilter: HistoryFilter
  customFrom?: string
  customTo?: string
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
  }
  return map[entityType] ?? "text-muted-foreground"
}

// ─── Detail Dialog ────────────────────────────────────────────────
function DetailDialog({ item, open, onClose }: { item: ActivityLogItem; open: boolean; onClose: () => void }) {
  const { label: actionLabel, icon: actionIcon, colorClass } = getActionMeta(item.action)

  let meta: Record<string, any> = {}
  try { if (item.metadata) meta = JSON.parse(item.metadata) } catch { /* ignore */ }

  const metaEntries = Object.entries(meta).filter(([, v]) => v !== null && v !== undefined && v !== "")

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm w-full p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 bg-muted/20">
          <DialogTitle className="flex items-center gap-2.5 text-sm">
            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg border ${colorClass}`}>
              {actionIcon}
            </span>
            <span className="font-bold">{actionLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          {/* Who */}
          <div className="flex items-start gap-2.5 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Performed By</p>
              <p className="font-semibold text-foreground mt-0.5">{item.actorName || item.actorEmail}</p>
              {item.actorName && <p className="text-muted-foreground text-[10px]">{item.actorEmail}</p>}
            </div>
          </div>

          {/* When */}
          <div className="flex items-start gap-2.5 text-xs">
            <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">When</p>
              <p className="font-semibold text-foreground mt-0.5">{format(new Date(item.createdAt), "dd MMM yyyy, hh:mm:ss a")}</p>
            </div>
          </div>

          {/* Entity */}
          <div className="flex items-start gap-2.5 text-xs">
            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Area</p>
              <p className={`font-semibold mt-0.5 ${entityColor(item.entityType)}`}>{item.entityType}</p>
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-start gap-2.5 text-xs">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Subject</p>
              <p className="font-semibold text-foreground mt-0.5">{item.label}</p>
              {item.detail && <p className="text-muted-foreground text-[10px] mt-0.5">{item.detail}</p>}
            </div>
          </div>

          {/* Raw metadata details */}
          {metaEntries.length > 0 && (
            <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
              {metaEntries.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="text-[11px] font-semibold text-foreground text-right truncate max-w-[160px]">{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Entity ID */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
            <Hash className="h-3 w-3 shrink-0" />
            <span className="font-mono truncate">{item.entityId}</span>
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
  const [selectedItem, setSelectedItem] = useState<ActivityLogItem | null>(null)

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); else sp.delete(k) })
    router.push(`/logs?${sp.toString()}`)
  }

  function setFilter(f: HistoryFilter) { navigate({ filter: f, page: "1", from: "", to: "" }) }
  function setPage(p: number) { navigate({ page: String(p) }) }

  return (
    <div className="space-y-4">
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

      {/* Table */}
      {items.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead className="text-[11px] font-bold w-[160px] hidden sm:table-cell">Date & Time</TableHead>
                <TableHead className="text-[11px] font-bold">Action</TableHead>
                <TableHead className="text-[11px] font-bold hidden md:table-cell">Subject</TableHead>
                <TableHead className="text-[11px] font-bold hidden lg:table-cell">Staff</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const { label: actionLabel, icon: actionIcon, colorClass } = getActionMeta(item.action)
                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-accent/40 transition-colors border-b border-border/40 last:border-0"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Date */}
                    <TableCell className="py-2.5 hidden sm:table-cell">
                      <div className="text-[11px] font-medium text-foreground">
                        {format(new Date(item.createdAt), "dd MMM yyyy")}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(item.createdAt), "hh:mm:ss a")}
                      </div>
                    </TableCell>

                    {/* Action badge */}
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 border whitespace-nowrap ${colorClass}`}
                      >
                        {actionIcon}
                        {actionLabel}
                      </Badge>
                      {/* On mobile show date inline */}
                      <div className="text-[10px] text-muted-foreground mt-0.5 sm:hidden">
                        {format(new Date(item.createdAt), "dd MMM, hh:mm a")}
                      </div>
                    </TableCell>

                    {/* Subject */}
                    <TableCell className="py-2.5 hidden md:table-cell">
                      <div className="text-xs font-semibold text-foreground truncate max-w-[180px]">{item.label}</div>
                      {item.detail && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{item.detail}</div>
                      )}
                    </TableCell>

                    {/* Staff */}
                    <TableCell className="py-2.5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-primary">
                            {(item.actorName || item.actorEmail)[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-foreground truncate max-w-[120px]">
                          {item.actorName || item.actorEmail}
                        </span>
                      </div>
                    </TableCell>

                    {/* Eye */}
                    <TableCell className="py-2.5 text-center">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors mx-auto" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
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

      {/* Detail Dialog */}
      {selectedItem && (
        <DetailDialog item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  )
}
