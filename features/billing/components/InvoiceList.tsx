"use client"

import { useState } from "react"
import { format } from "date-fns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Receipt, Search, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatInvoiceNumber } from "@/lib/formatters"

type InvoiceListItem = {
  id: string
  invoiceNumber?: number | null
  createdAt: Date | string
  sessionTotal: number
  cafeTotal: number
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
  if (status === "CANCELLED") return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
  if (status === "REFUNDED") return "bg-purple-500/10 text-purple-500 border-purple-500/20"
  return "bg-amber-500/10 text-amber-500 border-amber-500/20"
}

export function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const normalizedSearch = searchQuery.toLowerCase().trim()
  const filteredInvoices = invoices.filter((invoice) => {
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

  return (
    <div className="space-y-4">
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

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "ALL")}>
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

      <div className="grid gap-3 md:hidden">
        {filteredInvoices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <Receipt className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No invoices found matching current criteria.</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="rounded-lg border border-border bg-card p-4 space-y-3 active:bg-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {formatInvoiceNumber(invoice.invoiceNumber, invoice.id)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant="secondary" className={`text-[10px] font-medium ${statusClass(invoice.status)}`}>
                  {invoice.status}
                </Badge>
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-border/50 pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium text-foreground">
                    {invoice.customer?.name || "Guest"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-mono text-lg font-semibold text-foreground">
                    {formatCurrency(invoice.grandTotal)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="hidden rounded-lg border border-border bg-card overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Invoice</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Customer</TableHead>
              <TableHead className="text-xs text-right">Session</TableHead>
              <TableHead className="text-xs text-right">Cafe</TableHead>
              <TableHead className="text-xs text-right">Total</TableHead>
              <TableHead className="text-xs text-right">Status</TableHead>
              <TableHead className="text-xs text-right print:hidden">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Receipt className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No invoices found matching current criteria.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="font-mono text-xs text-foreground">
                    {formatInvoiceNumber(invoice.invoiceNumber, invoice.id)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invoice.customer?.name || "Guest"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right font-mono">
                    {formatCurrency(invoice.sessionTotal)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right font-mono">
                    {formatCurrency(invoice.cafeTotal)}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-foreground text-right font-mono">
                    {formatCurrency(invoice.grandTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={`text-[10px] font-medium ${statusClass(invoice.status)}`}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right print:hidden">
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
