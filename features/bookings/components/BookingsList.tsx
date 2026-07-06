"use client"

import { useState, useMemo } from "react"
import { format, isToday, isFuture, isPast, startOfDay } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CalendarClock, Ban, CheckCircle, Trash2, Play, Search, FilterX } from "lucide-react"
import { deleteBookingAction, updateBookingStatusAction } from "../actions/booking.actions"
import { toast } from "sonner"
import { BookingStartDialog } from "./BookingStartDialog"

type BookingViewModel = {
  id: string
  startTime: Date | string
  endTime: Date | string
  status: string
  customer: {
    id: string
    name: string
    phone: string
  }
  table: {
    id: string
    name: string
    tableType: {
      name: string
    }
  } | null
  tableType: {
    id: string
    name: string
  } | null
}

function statusClass(status: string) {
  if (status === "CONFIRMED") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  if (status === "COMPLETED") return "bg-blue-500/10 text-blue-500 border-blue-500/20"
  if (status === "CANCELLED") return "bg-red-500/10 text-red-500 border-red-500/20"
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
}

type TableList = {
  id: string
  name: string
  status: string
  tableType: {
    id: string
    name: string
  }
}

export function BookingsList({ bookings, tables }: { bookings: BookingViewModel[], tables: TableList[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [startDialogBooking, setStartDialogBooking] = useState<BookingViewModel | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("ALL")

  const handleStatusChange = async (id: string, status: string) => {
    setLoadingId(id)
    try {
      const res = await updateBookingStatusAction(id, status)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return
    setLoadingId(id)
    try {
      const res = await deleteBookingAction(id)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = b.customer.name.toLowerCase().includes(q) || b.customer.phone.includes(q)
      
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter

      let matchesDate = true
      const bDate = new Date(b.startTime)
      if (dateFilter === "TODAY") matchesDate = isToday(bDate)
      else if (dateFilter === "UPCOMING") matchesDate = isFuture(bDate)
      else if (dateFilter === "PAST") matchesDate = isPast(bDate)

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [bookings, searchQuery, statusFilter, dateFilter])

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "ALL" || dateFilter !== "ALL"
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
    setDateFilter("ALL")
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-card text-muted-foreground">
        <CalendarClock className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p>No bookings found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(val) => setDateFilter(val || "ALL")}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Dates</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
              <SelectItem value="PAST">Past</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0" title="Clear Filters">
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
           <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No bookings match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((b) => (
                <TableRow key={b.id} className="group">
                <TableCell>
                  <div className="font-medium text-foreground">{b.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{b.customer.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {b.table ? b.table.name : `Any ${b.tableType?.name} Table`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {b.table ? b.table.tableType.name : "Unassigned"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-foreground">
                    {format(new Date(b.startTime), "MMM dd, h:mm a")} &ndash; {format(new Date(b.endTime), "h:mm a")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[10px] uppercase font-semibold ${statusClass(b.status)}`}>
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      disabled={loadingId === b.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {b.status === "CONFIRMED" && (
                        <>
                          <DropdownMenuItem onClick={() => setStartDialogBooking(b)}>
                            <Play className="h-4 w-4 mr-2 text-primary" />
                            Start Session
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(b.id, "COMPLETED")}>
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(b.id, "CANCELLED")}>
                            <Ban className="h-4 w-4 mr-2 text-amber-500" />
                            Cancel Booking
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(b.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {startDialogBooking && (
        <BookingStartDialog
          open={!!startDialogBooking}
          onOpenChange={(open) => !open && setStartDialogBooking(null)}
          bookingId={startDialogBooking.id}
          tableId={startDialogBooking.table?.id || ""}
          tableTypeId={startDialogBooking.tableType?.id || ""}
          tableName={startDialogBooking.table?.name || `Any ${startDialogBooking.tableType?.name} Table`}
          customerId={startDialogBooking.customer.id}
          customerName={startDialogBooking.customer.name}
          availableTables={tables}
        />
      )}
    </>
  )
}
