"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { startSessionAction } from "@/features/sessions/actions/session.actions"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GamepadIcon, Loader2, Zap } from "lucide-react"

interface BookingStartDialogProps {
  bookingId: string
  tableId: string
  tableName: string
  customerId: string
  customerName: string
  tableTypeId?: string
  availableTables?: { id: string, name: string, status: string, tableType: { name: string, id: string } }[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingStartDialog({
  bookingId,
  tableId,
  tableName,
  customerId,
  customerName,
  tableTypeId,
  availableTables,
  open,
  onOpenChange,
}: BookingStartDialogProps) {
  const [loading, setLoading] = useState(false)
  const [extraCharges, setExtraCharges] = useState<number>(0)
  const [selectedTableId, setSelectedTableId] = useState<string>(tableId)

  // Filter available tables based on tableTypeId if this booking is for a specific type
  const selectableTables = availableTables?.filter(t => 
    t.status === "AVAILABLE" && (!tableTypeId || t.tableType.id === tableTypeId)
  ) || []

  const handleStart = async () => {
    if (!selectedTableId) {
      toast.error("Please select an available table")
      return
    }

    setLoading(true)
    try {
      const res = await startSessionAction({
        tableId: selectedTableId,
        customerId,
        bookingId,
        extraCharges,
      })

      if (res.success) {
        toast.success("Session started successfully!")
        onOpenChange(false)
      } else {
        toast.error(res.message || "Failed to start session")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <GamepadIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Start Session</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {tableName} &bull; {customerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Summary */}
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 space-y-3">
            {!tableId ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex justify-between">
                  <span>Assign Table</span>
                  <span className="text-primary font-medium text-[10px]">{selectableTables.length} available</span>
                </Label>
                <Select value={selectedTableId} onValueChange={(val) => setSelectedTableId(val || "")}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableTables.length === 0 ? (
                      <div className="text-xs text-muted-foreground p-2 text-center">No tables available</div>
                    ) : (
                      selectableTables.map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Table</span>
                <span className="font-semibold text-foreground">{tableName}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Customer</span>
              <span className="font-semibold text-foreground">{customerName}</span>
            </div>
          </div>

          {/* Extra Charges */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Extra Setup Charges (₹)
            </Label>
            <p className="text-[11px] text-muted-foreground">
              For extra controllers, special setup, or any one-time charges.
            </p>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={extraCharges || ""}
              onChange={(e) =>
                setExtraCharges(Math.max(0, Number(e.target.value)))
              }
              className="h-9 text-sm bg-background/60"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-9"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button className="flex-1 h-9" onClick={handleStart} disabled={loading || !selectedTableId}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <GamepadIcon className="h-4 w-4 mr-2" />
              )}
              {loading ? "Starting..." : "Start Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
