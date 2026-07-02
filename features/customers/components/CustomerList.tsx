"use client"

import { useState } from "react"
import { Customer } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Users, Star, Search } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

interface CustomerListProps {
  customers: Customer[]
}

export function CustomerList({ customers }: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const router = useRouter()

  const normalizedSearch = searchQuery.toLowerCase().trim()
  const filteredCustomers = customers.filter((customer) => {
    return (
      normalizedSearch.length === 0 ||
      customer.name.toLowerCase().includes(normalizedSearch) ||
      customer.phone.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(normalizedSearch)
    )
  })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage)

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search customer name, phone or email..."
          className="pl-9 h-9 text-xs"
          value={searchQuery}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Users className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No customers found matching &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {paginatedCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="rounded-lg border border-border bg-card p-4 text-left active:bg-accent/60"
                onClick={() => router.push(`/customers/${customer.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                    {customer.name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Added {format(new Date(customer.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(customer.totalSpend)}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center justify-end gap-1 mt-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      {customer.loyaltyPoints}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden rounded-lg border border-border bg-card overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Total Spend</TableHead>
                  <TableHead className="text-xs">Loyalty</TableHead>
                  <TableHead className="text-right text-xs">Added On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground shrink-0">
                          {customer.name[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {customer.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.phone}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {formatCurrency(customer.totalSpend)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-500" />
                        {customer.loyaltyPoints}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground font-mono">
                      {format(new Date(customer.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40 pt-4 px-1">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(startIndex + itemsPerPage, filteredCustomers.length)}
                </span>{" "}
                of <span className="font-medium text-foreground">{filteredCustomers.length}</span> customers
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 bg-background/50 border-border"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1
                    if (
                      totalPages <= 5 ||
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 text-xs p-0 border-border"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={pageNum} className="text-xs text-muted-foreground px-1 select-none">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 bg-background/50 border-border"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
