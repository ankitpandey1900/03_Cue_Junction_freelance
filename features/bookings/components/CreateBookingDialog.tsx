"use client"

import { useState } from "react"
import { Customer, Table } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createBookingAction } from "../actions/booking.actions"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

// Types
type CustomerList = Pick<Customer, "id" | "name" | "phone">
type TableList = Table & { tableType: { name: string } }

interface CreateBookingDialogProps {
  customers: CustomerList[]
  tables: TableList[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBookingDialog({
  customers,
  tables,
  open,
  onOpenChange,
}: CreateBookingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState<string>("")
  const [tableId, setTableId] = useState<string>("")
  
  // Set default times (start: next hour, end: +1 hour from start)
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  
  const end = new Date(now)
  end.setHours(end.getHours() + 1)

  // Convert to datetime-local string format YYYY-MM-DDThh:mm
  const formatForInput = (d: Date) => {
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
  }

  const [startTime, setStartTime] = useState(formatForInput(now))
  const [endTime, setEndTime] = useState(formatForInput(end))

  const selectedCustomer = customers.find((c) => c.id === customerId)
  const selectedTable = tables.find((t) => t.id === tableId)

  const handleCreate = async () => {
    if (!customerId) return toast.error("Please select a customer")
    if (!tableId) return toast.error("Please select a table")

    setLoading(true)
    try {
      const res = await createBookingAction({
        customerId,
        tableId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        status: "CONFIRMED"
      })

      if (res.success) {
        toast.success(res.message)
        onOpenChange(false)
        setCustomerId("")
        setTableId("")
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Select Customer</Label>
            <Select value={customerId} onValueChange={(val) => setCustomerId(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer...">
                  {selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ""}` : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Select Table</Label>
            <Select value={tableId} onValueChange={(val) => setTableId(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table...">
                  {selectedTable ? `${selectedTable.name} (${selectedTable.tableType.name})` : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.tableType.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Start Time</Label>
              <Input 
                type="datetime-local" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">End Time</Label>
              <Input 
                type="datetime-local" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !customerId || !tableId}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Create Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
