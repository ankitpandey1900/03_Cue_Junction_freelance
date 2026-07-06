"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Receipt, Search, ChevronRight } from "lucide-react"
import Link from "next/link"
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

// Grouping types
type GroupedData = {
  [year: string]: {
    total: number;
    months: {
      [month: string]: {
        total: number;
        weeks: {
          [week: string]: {
            total: number;
            dates: {
              [date: string]: {
                total: number;
                invoices: InvoiceListItem[];
              };
            };
          };
        };
      };
    };
  };
};

export function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Keep track of expanded groups
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const normalizedSearch = searchQuery.toLowerCase().trim()
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const invoiceLabel = formatInvoiceNumber(invoice.invoiceNumber, invoice.id).toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 ||
        invoice.id.toLowerCase().includes(normalizedSearch) ||
        invoiceLabel.includes(normalizedSearch) ||
        invoice.customer?.name?.toLowerCase().includes(normalizedSearch) ||
        invoice.customer?.phone?.includes(searchQuery)

      const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, normalizedSearch, searchQuery, statusFilter])

  // If user is searching, expand all nodes automatically
  const isSearching = normalizedSearch.length > 0 || statusFilter !== "ALL"

  const groupedData = useMemo(() => {
    const data: GroupedData = {}
    
    // Sort invoices descending (newest first)
    const sorted = [...filteredInvoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    sorted.forEach((invoice) => {
      const d = new Date(invoice.createdAt)
      const year = format(d, "yyyy")
      const month = format(d, "MMMM") // e.g., "July"
      // Quick fallback if getWeekOfMonth fails for some reason
      const weekNum = Math.ceil(d.getDate() / 7)
      const week = `WEEK ${weekNum}`
      const dateStr = format(d, "EEE, MMM d").toUpperCase() // e.g., "SUN, JUL 5"

      const amount = invoice.status !== "CANCELLED" ? invoice.grandTotal : 0

      if (!data[year]) data[year] = { total: 0, months: {} }
      data[year].total += amount
      
      if (!data[year].months[month]) data[year].months[month] = { total: 0, weeks: {} }
      data[year].months[month].total += amount

      if (!data[year].months[month].weeks[week]) data[year].months[month].weeks[week] = { total: 0, dates: {} }
      data[year].months[month].weeks[week].total += amount

      if (!data[year].months[month].weeks[week].dates[dateStr]) data[year].months[month].weeks[week].dates[dateStr] = { total: 0, invoices: [] }
      data[year].months[month].weeks[week].dates[dateStr].total += amount
      data[year].months[month].weeks[week].dates[dateStr].invoices.push(invoice)
    })

    return data
  }, [filteredInvoices])

  const isExpanded = (nodeId: string) => isSearching || expandedNodes.has(nodeId)

  const renderGroupHeader = (nodeId: string, label: string, total: number, depth: number) => {
    const expanded = isExpanded(nodeId)
    return (
      <div 
        onClick={(e) => toggleNode(nodeId, e)} 
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer hover:bg-accent/40 border-b border-border/40 transition-colors select-none",
          depth === 0 && "bg-card/50",
          depth === 1 && "bg-card/30 pl-6",
          depth === 2 && "bg-background pl-10",
          depth === 3 && "bg-background pl-14"
        )}
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          <span className={cn(
            "uppercase tracking-wider",
            depth === 0 && "font-bold text-base text-foreground",
            depth === 1 && "font-bold text-sm text-foreground",
            depth === 2 && "font-semibold text-xs text-muted-foreground",
            depth === 3 && "font-bold text-xs text-foreground"
          )}>
            {label}
          </span>
        </div>
        {total > 0 && (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-mono px-2 py-0.5">
            IN +{formatCurrency(total)}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-10">
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

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs bg-background/50 border-border">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/20 overflow-hidden shadow-sm">
        {Object.keys(groupedData).length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-6 w-6 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No invoices found matching current criteria.</p>
          </div>
        ) : (
          Object.entries(groupedData).map(([year, yearData]) => (
            <div key={year} className="group-year">
              {renderGroupHeader(year, year, yearData.total, 0)}
              
              {isExpanded(year) && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  {Object.entries(yearData.months).map(([month, monthData]) => {
                    const monthId = `${year}-${month}`
                    return (
                      <div key={monthId} className="group-month border-l border-border/30 ml-2">
                        {renderGroupHeader(monthId, month, monthData.total, 1)}
                        
                        {isExpanded(monthId) && (
                          <div className="animate-in slide-in-from-top-2 duration-200">
                            {Object.entries(monthData.weeks).map(([week, weekData]) => {
                              const weekId = `${monthId}-${week}`
                              return (
                                <div key={weekId} className="group-week border-l border-border/30 ml-4">
                                  {renderGroupHeader(weekId, week, weekData.total, 2)}
                                  
                                  {isExpanded(weekId) && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                      {Object.entries(weekData.dates).map(([dateStr, dateData]) => {
                                        const dateId = `${weekId}-${dateStr}`
                                        return (
                                          <div key={dateId} className="group-date border-l border-border/30 ml-4">
                                            {renderGroupHeader(dateId, dateStr, dateData.total, 3)}
                                            
                                            {isExpanded(dateId) && (
                                              <div className="animate-in slide-in-from-top-2 duration-200 bg-background/50 divide-y divide-border/40">
                                                {dateData.invoices.map((invoice) => (
                                                  <Link 
                                                    key={invoice.id} 
                                                    href={`/invoices/${invoice.id}`} 
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-accent/40 transition-colors pl-6 sm:pl-16 gap-3"
                                                  >
                                                    <div className="flex items-center gap-4">
                                                      <div className="hidden sm:flex h-10 w-10 rounded-full bg-amber-500/10 items-center justify-center shrink-0 border border-amber-500/20">
                                                        <Receipt className="h-4 w-4 text-amber-500" />
                                                      </div>
                                                      <div>
                                                        <div className="flex items-center gap-2">
                                                          <p className="text-sm font-semibold text-foreground">
                                                            {invoice.customer?.name || "Guest"}
                                                          </p>
                                                          <span className="text-[10px] text-muted-foreground font-mono">
                                                            {formatInvoiceNumber(invoice.invoiceNumber, invoice.id)}
                                                          </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                          <Badge variant="secondary" className={cn("text-[9px] px-1.5 py-0 uppercase tracking-wider font-bold", statusClass(invoice.status))}>
                                                            {invoice.status}
                                                          </Badge>
                                                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            Session: {formatCurrency(invoice.sessionTotal)} • Cafe: {formatCurrency(invoice.cafeTotal)}
                                                            {invoice.discountAmount > 0 && ` • ${invoice.status === 'CANCELLED' ? 'Voided' : 'Disc'}: -${formatCurrency(invoice.discountAmount)}`}
                                                            {invoice.taxAmount > 0 && ` • Tax: +${formatCurrency(invoice.taxAmount)}`}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                      <p className={cn(
                                                        "font-mono text-base font-semibold",
                                                        invoice.status === "PAID" || invoice.status === "PARTIAL" 
                                                          ? "text-emerald-500" 
                                                          : "text-foreground"
                                                      )}>
                                                        {formatCurrency(invoice.grandTotal)}
                                                      </p>
                                                    </div>
                                                  </Link>
                                                ))}
                                              </div>
                                            )}
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
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
