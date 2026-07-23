"use client"

import { useState, useEffect } from "react"
import { Session, Table, TableType, Customer, CustomerOrder, CustomerOrderItem } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { pauseSessionAction, resumeSessionAction, switchTableAction, endSessionAction } from "../actions/session.actions"
import { checkoutCustomerAction } from "@/features/billing/actions/billing.actions"
import { updateOrderStatusAction } from "@/features/cafe/actions/cafe.actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Square, Loader2, ShoppingBag, Pause, Play, ArrowRightLeft, StopCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export type SessionWithDetails = Session & {
  table: Table & { tableType: TableType }
  customer: Customer | null
  orders: (CustomerOrder & { orderItems: CustomerOrderItem[] })[]
}

interface ActiveSessionCardProps {
  session: SessionWithDetails
  availableTables?: any[]
}

export function ActiveSessionCard({ session, availableTables = [] }: ActiveSessionCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(false)
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [switchTableId, setSwitchTableId] = useState("")
  const [switchExtraCharges, setSwitchExtraCharges] = useState(0)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const router = useRouter()

  const handleToggleOrderStatus = async (orderId: string, currentStatus: string) => {
    if (updatingOrderId) return
    const nextStatus = currentStatus === "PENDING" ? "SERVED" : "PENDING"
    setUpdatingOrderId(orderId)
    try {
      const res = await updateOrderStatusAction(orderId, nextStatus)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to update status")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Real-time live timer logic (Frontend only, no polling!)
  useEffect(() => {
    const calculateElapsed = () => {
      let end = new Date().getTime()
      if (session.status === "PAUSED" && session.lastPausedAt) {
        end = new Date(session.lastPausedAt).getTime()
      }
      const start = new Date(session.startTime).getTime()
      let seconds = Math.floor((end - start) / 1000)
      const pauseSeconds = session.totalPauseDurationSeconds
      seconds -= pauseSeconds
      setElapsedSeconds(Math.max(0, seconds))
    }

    calculateElapsed()
    const interval = setInterval(calculateElapsed, 1000) // Real-time live timer
    return () => clearInterval(interval)
  }, [session.startTime, session.totalPauseDurationSeconds, session.status, session.lastPausedAt])

  const handleTogglePause = async () => {
    if (loading) return
    setLoading(true)
    try {
      const isPaused = session.status === "PAUSED"
      const res = isPaused ? await resumeSessionAction(session.id) : await pauseSessionAction(session.id)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to toggle session state")
    } finally {
      setLoading(false)
    }
  }

  const handleEndOnly = async () => {
    setLoading(true)
    try {
      const res = await endSessionAction(session.id)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to stop table")
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    setLoading(true)
    try {
      const res = await checkoutCustomerAction(session.customerId ?? undefined, session.id)
      if (res.success && res.data?.id) {
        toast.success("Checkout complete. Redirecting to invoice...")
        router.push(`/invoices/${res.data.id}`)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to end session and checkout")
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchTable = async () => {
    if (!switchTableId) {
      toast.error("Please select a table to switch to")
      return
    }
    setLoading(true)
    try {
      const res = await switchTableAction(session.id, switchTableId, switchExtraCharges)
      if (res.success) {
        toast.success(res.message)
        setSwitchDialogOpen(false)
        setSwitchTableId("")
        setSwitchExtraCharges(0)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to switch table")
    } finally {
      setLoading(false)
    }
  }

  // Formatting: first 60 mins is countdown, after that is count up (overtime)
  const isCountdown = elapsedSeconds < 3600
  let displayMins = 0
  let displaySecs = 0
  let isOvertime = false

  if (isCountdown) {
    const remainingSeconds = 3600 - elapsedSeconds
    displayMins = Math.floor(remainingSeconds / 60)
    displaySecs = remainingSeconds % 60
  } else {
    const overtimeSeconds = elapsedSeconds - 3600
    displayMins = Math.floor(overtimeSeconds / 60)
    displaySecs = overtimeSeconds % 60
    isOvertime = true
  }

  const pad = (num: number) => num.toString().padStart(2, "0")
  const timerLabel = isOvertime ? "OVERTIME (+)" : "MIN. HOUR COUNTDOWN (-)"
  const timerString = `${isOvertime ? "+" : ""}${pad(displayMins)}:${pad(displaySecs)}`
  
  const totalHours = Math.floor(elapsedSeconds / 3600)
  const totalMins = Math.floor((elapsedSeconds % 3600) / 60)
  const totalSecs = elapsedSeconds % 60
  const totalTimeString = `Total: ${totalHours > 0 ? totalHours + "h " : ""}${totalMins}m ${totalSecs}s`

  // Live estimated cost (remains based on actual elapsed minutes)
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const totalMinutes = Math.max(1, elapsedMinutes)
  const type = session.table.tableType
  let estimatedCost = 0

  if (type.fixedRate != null && type.fixedDuration != null && type.fixedDuration > 0) {
    if (totalMinutes <= type.fixedDuration) {
      estimatedCost = type.fixedRate
    } else {
      const extraMinutes = totalMinutes - type.fixedDuration
      const applicableHourlyRate = type.overtimeHourlyRate ?? type.hourlyRate
      estimatedCost = type.fixedRate + (extraMinutes / 60) * applicableHourlyRate
    }
  } else {
    estimatedCost = (totalMinutes / 60) * type.hourlyRate
  }

  if (estimatedCost < type.minimumCharge) {
    estimatedCost = type.minimumCharge
  }

  const cafeTotal = session.orders?.reduce((sum, order) => sum + order.total, 0) || 0
  const grandTotal = estimatedCost + cafeTotal

  return (
    <>
    <Card className="hover:border-border/80 transition-colors">
      <CardContent className="p-4 space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {session.table.name}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {session.customer?.name || "Walk-in Guest"}
            </p>
          </div>
          {/* Live pulse dot or Paused dot */}
          <div className="flex items-center gap-1.5">
            {session.status === "PAUSED" ? (
              <>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wider">Paused</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Live</span>
              </>
            )}
          </div>
        </div>

        {/* Timer & Start time */}
        <div className="flex justify-between items-end border-b border-border/40 pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground block uppercase tracking-wider">{timerLabel}</span>
            <span className={`text-xl font-mono font-bold tracking-tight block ${isOvertime ? "text-rose-500" : "text-emerald-500"}`}>
              {timerString}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground block">
              {totalTimeString}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium text-muted-foreground block">STARTED AT</span>
            <span className="text-xs font-medium text-foreground">
              {format(new Date(session.startTime), "hh:mm a")}
            </span>
          </div>
        </div>

        {/* Billing Estimations */}
        <div className="space-y-1.5 text-xs border-b border-border/40 pb-2.5">
          <div className="flex justify-between text-muted-foreground">
            <span>Play Charge</span>
            <span className="font-mono text-foreground">₹{estimatedCost.toFixed(0)}</span>
          </div>
          {cafeTotal > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Cafe Orders</span>
              <span className="font-mono text-foreground">₹{cafeTotal.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-dashed border-border/30">
            <span>Current Balance</span>
            <span className="font-mono text-primary">₹{grandTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* Cafe Order History Summary */}
        {session.orders && session.orders.length > 0 && (
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              Cafe items ({session.orders.flatMap(o => o.orderItems).length})
            </p>
            <div className="space-y-1 text-[11px]">
              {session.orders.flatMap((order) => 
                order.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-muted-foreground">
                    <span>{item.itemNameSnapshot} (x{item.quantity})</span>
                    <button
                      type="button"
                      disabled={updatingOrderId === order.id}
                      onClick={() => handleToggleOrderStatus(order.id, order.status)}
                      className="shrink-0 transition-opacity hover:opacity-85"
                      title="Click to toggle status (Pending / Served)"
                    >
                      <Badge 
                        variant="outline" 
                        className={`text-[8.5px] px-1.5 py-0.5 select-none cursor-pointer font-semibold ${
                          order.status === "PENDING" 
                            ? "border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10" 
                            : "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10"
                        }`}
                      >
                        {updatingOrderId === order.id ? "Updating…" : order.status}
                      </Badge>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/cafe?sessionId=${session.id}`} className="col-span-1">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 px-2">
              Add Food
            </Button>
          </Link>
          <Button
            onClick={() => setSwitchDialogOpen(true)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 border-border"
          >
            <ArrowRightLeft className="h-3 w-3" />
            Switch
          </Button>
          <Button
            onClick={handleTogglePause}
            disabled={loading}
            variant="outline"
            size="sm"
            className={`w-full h-8 text-xs gap-1.5 border-border ${!session.customer ? "col-span-2" : ""} ${
              session.status === "PAUSED" 
                ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" 
                : "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
            }`}
          >
            {session.status === "PAUSED" ? (
              <>
                <Play className="h-3 w-3" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" />
                Pause
              </>
            )}
          </Button>
          {session.customer && (
            <Button
              onClick={handleEndOnly}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5 border-border hover:bg-secondary"
            >
              <StopCircle className="h-3 w-3" />
              Stop Table
            </Button>
          )}
          <Button
            onClick={handleEndSession}
            disabled={loading}
            variant="outline"
            size="sm"
            className="col-span-2 w-full h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Ending…
              </>
            ) : (
              <>
                <Square className="h-3 w-3" />
                Checkout & Bill All
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Switch Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Select Target Table</Label>
            <Select value={switchTableId} onValueChange={(val) => setSwitchTableId(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an available table...">
                  {availableTables.find(t => t.id === switchTableId) 
                    ? `${availableTables.find(t => t.id === switchTableId)?.name} (${availableTables.find(t => t.id === switchTableId)?.tableType.name})` 
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.tableType.name})
                  </SelectItem>
                ))}
                {availableTables.length === 0 && (
                  <SelectItem value="none" disabled>
                    No available tables
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Extra Controller / Setup Charge (₹)</Label>
            <Input
              type="number"
              placeholder="0"
              value={switchExtraCharges || ""}
              onChange={(e) => setSwitchExtraCharges(Math.max(0, Number(e.target.value)))}
            />
            <p className="text-xs text-muted-foreground">
              Only add if there is a new setup cost for the switched table.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSwitchTable} disabled={loading || !switchTableId}>
            {loading ? "Switching..." : "Confirm Switch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
