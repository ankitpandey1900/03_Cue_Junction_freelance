"use client"

import { useState, useMemo } from "react"
import { format, isToday, isFuture, isPast } from "date-fns"
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
import { Card } from "@/components/ui/card"
import { MoreHorizontal, CalendarClock, Ban, CheckCircle, Trash2, Play, Search, FilterX, Plus } from "lucide-react"
import { deleteBookingAction, updateBookingStatusAction } from "../actions/booking.actions"
import { toast } from "sonner"
import { BookingStartDialog } from "./BookingStartDialog"
import { CreateBookingDialog } from "./CreateBookingDialog"

import { Table as PrismaTable } from "@prisma/client"

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

type TableList = PrismaTable & {
  tableType: {
    id: string
    name: string
  }
}

function statusClass(status: string) {
  if (status === "CONFIRMED") return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
  if (status === "COMPLETED") return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
  if (status === "CANCELLED") return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
  return "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20"
}

// Simple avatar generator
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export function BookingsList({ 
  bookings, 
  tables,
  customers,
  tableTypes
}: { 
  bookings: BookingViewModel[]
  tables: TableList[]
  customers: { id: string, name: string, phone: string }[]
  tableTypes: { id: string, name: string }[]
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [startDialogBooking, setStartDialogBooking] = useState<BookingViewModel | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

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

  return (
    <>
      <Card className="shadow-sm border-border overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
                <SelectTrigger className="h-9 w-[130px] bg-background">
                  <SelectValue placeholder="Status" />
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
                <SelectTrigger className="h-9 w-[130px] bg-background">
                  <SelectValue placeholder="Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Dates</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="PAST">Past</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 shrink-0" title="Clear Filters">
                  <FilterX className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
          
          <Button onClick={() => setCreateOpen(true)} size="sm" className="w-full sm:w-auto h-9 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4 w-[250px]">Customer</TableHead>
            <TableHead>Table</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
          </TableHeader>
          <TableBody>
          {filteredBookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <CalendarClock className="h-8 w-8 mb-3 opacity-20" />
                  <p>No bookings match your filters.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredBookings.map((b) => (
              <TableRow key={b.id} className="group transition-colors hover:bg-muted/50">
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(b.customer.name)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-foreground truncate">{b.customer.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{b.customer.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {b.table ? b.table.name : `Any ${b.tableType?.name} Table`}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {b.table ? b.table.tableType.name : "Unassigned"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {format(new Date(b.startTime), "MMM dd, yyyy")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(b.startTime), "h:mm a")} &ndash; {format(new Date(b.endTime), "h:mm a")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border-transparent tracking-wide ${statusClass(b.status)}`}>
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none transition-colors"
                      disabled={loadingId === b.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {b.status === "CONFIRMED" && (
                        <>
                          <DropdownMenuItem onClick={() => setStartDialogBooking(b)} className="font-medium cursor-pointer">
                            <Play className="h-4 w-4 mr-2 text-primary" />
                            Start Session
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(b.id, "COMPLETED")} className="cursor-pointer">
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(b.id, "CANCELLED")} className="cursor-pointer">
                            <Ban className="h-4 w-4 mr-2 text-amber-500" />
                            Cancel Booking
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(b.id)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
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
      </Card>

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

      <CreateBookingDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        customers={customers}
        tables={tables}
        tableTypes={tableTypes}
      />
    </>
  )
}
