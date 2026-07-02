"use client"

import { useState } from "react"
import { Customer } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { startSessionAction } from "../actions/session.actions"
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

interface StartSessionDialogProps {
  tableId: string
  tableName: string
  customers: Customer[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartSessionDialog({
  tableId,
  tableName,
  customers,
  open,
  onOpenChange,
}: StartSessionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState<string>("guest")
  const [searchQuery, setSearchQuery] = useState("")
  const [extraCharges, setExtraCharges] = useState<number>(0)

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await startSessionAction({
        tableId,
        customerId: customerId === "guest" ? undefined : customerId,
        extraCharges,
      })

      if (res.success) {
        toast.success(res.message)
        onOpenChange(false)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to start session")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setCustomerId("guest")
      setSearchQuery("")
      setExtraCharges(0)
    }
    onOpenChange(nextOpen)
  }

  // Filter customers by name or phone
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Session on {tableName}</DialogTitle>
          <DialogDescription>
            Select a customer or start as a Guest. Billing starts immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Lookup Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Search Customer (Name or Phone)</Label>
            <Input
              placeholder="Type name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Select Customer ({filteredCustomers.length} match)</Label>
            <Select
              value={customerId}
              onValueChange={(val) => setCustomerId(val || "guest")}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select a customer">
                  {(value) => {
                    if (value === "guest") return "Guest (No account)"
                    const selected = customers.find((c) => c.id === value)
                    return selected ? `${selected.name} (${selected.phone})` : "Guest (No account)"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Guest (No account)</SelectItem>
                {filteredCustomers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {`${c.name} (${c.phone})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Extra Setup / Controller Charge (₹)</Label>
            <Input
              type="number"
              placeholder="0"
              value={extraCharges || ""}
              onChange={(e) => setExtraCharges(Math.max(0, Number(e.target.value)))}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={loading}>
            {loading ? "Starting…" : "Start Timer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
