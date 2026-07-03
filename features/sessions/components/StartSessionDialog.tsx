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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
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
  const [openCustomer, setOpenCustomer] = useState(false)
  const [extraCharges, setExtraCharges] = useState<number>(0)

  const selectedCustomer = customers.find((c) => c.id === customerId)

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
      setExtraCharges(0)
      setOpenCustomer(false)
    }
    onOpenChange(nextOpen)
  }

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
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Select Customer</Label>
            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
              <PopoverTrigger render={<Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm" />}>
                {customerId === "guest"
                  ? "Guest (No account)"
                  : selectedCustomer
                  ? `${selectedCustomer.name} (${selectedCustomer.phone})`
                  : "Search or select a customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search customers..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="Guest (No account)"
                        onSelect={() => {
                          setCustomerId("guest")
                          setOpenCustomer(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === "guest" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Guest (No account)
                      </CommandItem>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.name} ${c.phone}`}
                          onSelect={() => {
                            setCustomerId(c.id)
                            setOpenCustomer(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              customerId === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.name} ({c.phone})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
