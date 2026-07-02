"use client"

import { useState } from "react"
import { format } from "date-fns"
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
import { MoreHorizontal, CalendarClock, Ban, CheckCircle, Trash2, Play } from "lucide-react"
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
  }
}

function statusClass(status: string) {
  if (status === "CONFIRMED") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  if (status === "COMPLETED") return "bg-blue-500/10 text-blue-500 border-blue-500/20"
  if (status === "CANCELLED") return "bg-red-500/10 text-red-500 border-red-500/20"
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
}

export function BookingsList({ bookings }: { bookings: BookingViewModel[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [startDialogBooking, setStartDialogBooking] = useState<BookingViewModel | null>(null)

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
            {bookings.map((b) => (
              <TableRow key={b.id} className="group">
                <TableCell>
                  <div className="font-medium text-foreground">{b.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{b.customer.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{b.table.name}</div>
                  <div className="text-xs text-muted-foreground">{b.table.tableType.name}</div>
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
            ))}
          </TableBody>
        </Table>
      </div>

      {startDialogBooking && (
        <BookingStartDialog
          open={!!startDialogBooking}
          onOpenChange={(open) => { if (!open) setStartDialogBooking(null) }}
          bookingId={startDialogBooking.id}
          tableId={startDialogBooking.table.id}
          tableName={startDialogBooking.table.name}
          customerId={startDialogBooking.customer.id}
          customerName={startDialogBooking.customer.name}
        />
      )}
    </>
  )
}
