"use client"

import { useState, useMemo, useEffect } from "react"
import { formatInTimeZone } from "date-fns-tz"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Receipt, Search, Eye, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency, formatInvoiceNumber } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type InvoiceListItem = {
  id: string
  invoiceNumber?: number | null
  createdAt: Date | string
  sessionTotal: number
  cafeTotal: number
  discountAmount: number
  taxAmount: number
  grandTotal: number
  status: string
  customer: {
    name: string
    phone: string
  } | null
}

function statusClass(status: string) {
  if (status === "PAID") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  if (status === "PARTIAL") return "bg-blue-500/10 text-blue-500 border-blue-500/20"
  if (status === "CANCELLED") return "bg-red-500/10 text-red-500 border-red-500/20"
  if (status === "REFUNDED") return "bg-purple-500/10 text-purple-500 border-purple-500/20"
  if (status === "UNPAID") return "bg-amber-500/10 text-amber-500 border-amber-500/20"
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
}

const FILTERS = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week",      label: "Last 7 Days" },
  { value: "month",     label: "Last 30 Days" },
  { value: "all",       label: "All Time" },
]

export function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [currentFilter, setCurrentFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const normalizedSearch = searchQuery.toLowerCase().trim()
  
  const filteredInvoices = useMemo(() => {
    const sorted = [...invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return sorted.filter((invoice) => {
      const invoiceLabel = formatInvoiceNumber(invoice.invoiceNumber, invoice.id).toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 ||
        invoice.id.toLowerCase().includes(normalizedSearch) ||
        invoiceLabel.includes(normalizedSearch) ||
        invoice.customer?.name?.toLowerCase().includes(normalizedSearch) ||
        invoice.customer?.phone?.includes(searchQuery)

      const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter
      
      const invoiceDate = new Date(invoice.createdAt)
      const matchesStartDate = startDate === "" || invoiceDate >= new Date(startDate)
      
      let matchesEndDate = true
      if (endDate !== "") {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        matchesEndDate = invoiceDate <= end
      }

      let matchesPresetDate = true
      if (currentFilter !== "all") {
        const now = new Date()
        let startPreset = new Date(0)
        let endPreset = new Date()
        endPreset.setHours(23, 59, 59, 999)

        if (currentFilter === "today") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (currentFilter === "yesterday") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          endPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        } else if (currentFilter === "week") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        } else if (currentFilter === "month") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
        }

        matchesPresetDate = invoiceDate >= startPreset && invoiceDate <= endPreset
      }

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate && matchesPresetDate
    })
  }, [invoices, normalizedSearch, searchQuery, statusFilter, startDate, endDate, currentFilter])

  const ITEMS_PER_PAGE = 20
  const [page, setPage] = useState(1)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, startDate, endDate, currentFilter])

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE))
  const paginatedInvoices = filteredInvoices.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const statusCounts = useMemo(() => {
    // Count statuses from the date-filtered set (not the status-filtered set)
    const dateFiltered = [...invoices].filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt)
      const matchesStartDate = startDate === "" || invoiceDate >= new Date(startDate)
      let matchesEndDate = true
      if (endDate !== "") {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        matchesEndDate = invoiceDate <= end
      }
      let matchesPresetDate = true
      if (currentFilter !== "all") {
        const now = new Date()
        let startPreset = new Date(0)
        let endPreset = new Date()
        endPreset.setHours(23, 59, 59, 999)
        if (currentFilter === "today") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (currentFilter === "yesterday") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          endPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        } else if (currentFilter === "week") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        } else if (currentFilter === "month") {
          startPreset = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
        }
        matchesPresetDate = invoiceDate >= startPreset && invoiceDate <= endPreset
      }
      return matchesStartDate && matchesEndDate && matchesPresetDate
    })
    const counts: Record<string, number> = { ALL: dateFiltered.length }
    for (const inv of dateFiltered) {
      counts[inv.status] = (counts[inv.status] || 0) + 1
    }
    return counts
  }, [invoices, startDate, endDate, currentFilter])

  const STATUS_PILLS = [
    { value: "ALL", label: "All", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" },
    { value: "UNPAID", label: "Unpaid", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
    { value: "PARTIAL", label: "Partial", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
    { value: "PAID", label: "Paid", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/30" },
    { value: "REFUNDED", label: "Refunded", color: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  ]

  return (
    <div className="space-y-4 pb-10">
      {/* Date Quick Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setCurrentFilter(f.value)}
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

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_PILLS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
              statusFilter === s.value
                ? `${s.color} ring-1 ring-current/30 shadow-sm`
                : "bg-card/50 text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
            )}
          >
            {s.label}
            {(statusCounts[s.value] || 0) > 0 && (
              <span className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                statusFilter === s.value ? "bg-background/20" : "bg-muted/50"
              )}>
                {statusCounts[s.value] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Date Range */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search invoice, customer or phone..."
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-[130px] h-9 text-xs"
            title="Start Date"
          />
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-[130px] h-9 text-xs"
            title="End Date"
          />
        </div>
      </div>

      {/* Flat Data Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        {filteredInvoices.length === 0 ? (
          <div className="p-16 text-center bg-card/20">
            <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium text-foreground">No invoices found matching current criteria.</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="whitespace-nowrap font-semibold">Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Invoice & Customer</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Status</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold hidden md:table-cell">Breakdown</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-right">Grand Total</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="hover:bg-accent/40 transition-colors cursor-pointer"
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  >
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {formatInTimeZone(new Date(invoice.createdAt), "Asia/Kolkata", "MMM dd, yyyy")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatInTimeZone(new Date(invoice.createdAt), "Asia/Kolkata", "hh:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex h-8 w-8 rounded-full bg-amber-500/10 items-center justify-center shrink-0 border border-amber-500/20">
                          <Receipt className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-xs">
                              {invoice.customer?.name || "Walk-in Guest"}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatInvoiceNumber(invoice.invoiceNumber, invoice.id)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary" className={cn("text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold", statusClass(invoice.status))}>
                        {invoice.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden md:table-cell max-w-[250px]">
                      <span className="text-[11px] text-muted-foreground flex flex-wrap gap-1.5">
                        <span>Session: {formatCurrency(invoice.sessionTotal)}</span>
                        <span>• Cafe: {formatCurrency(invoice.cafeTotal)}</span>
                        {invoice.discountAmount > 0 && <span>• {invoice.status === 'CANCELLED' ? 'Voided' : 'Disc'}: -{formatCurrency(invoice.discountAmount)}</span>}
                        {invoice.taxAmount > 0 && <span>• Tax: +{formatCurrency(invoice.taxAmount)}</span>}
                      </span>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <p className={cn(
                        "font-mono text-sm font-bold",
                        invoice.status === "PAID" || invoice.status === "PARTIAL" 
                          ? "text-emerald-500" 
                          : "text-foreground"
                      )}>
                        {formatCurrency(invoice.grandTotal)}
                      </p>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/invoices/${invoice.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
            <span className="ml-2">({filteredInvoices.length} total invoices)</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
