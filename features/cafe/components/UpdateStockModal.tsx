"use client"

import { useState } from "react"
import { updateStockAction } from "../actions/item.actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PackagePlus } from "lucide-react"

interface UpdateStockModalProps {
  itemId: string
  itemName: string
  currentStock: number
}

export function UpdateStockModal({ itemId, itemName, currentStock }: UpdateStockModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quantityChange, setQuantityChange] = useState<number>(0)
  const [note, setNote] = useState("")

  const handleSubmit = async () => {
    if (quantityChange === 0) {
      toast.error("Please enter a quantity change (+ or -)")
      return
    }

    setLoading(true)
    const finalNote = note.trim() ? note.trim() : "Manual stock adjustment"
    const res = await updateStockAction(itemId, quantityChange, finalNote)
    setLoading(false)

    if (res.success) {
      toast.success(res.message)
      setOpen(false)
      setQuantityChange(0)
      setNote("")
    } else {
      toast.error(res.message)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setQuantityChange(0)
      setNote("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <PackagePlus className="h-4 w-4" />
            Stock
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Inventory Stock</DialogTitle>
          <DialogDescription>
            Add or remove stock for <strong>{itemName}</strong>. Current stock is {currentStock}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Add / Remove Stock</label>
            <Input
              type="number"
              placeholder="e.g. 10 or -5"
              value={quantityChange || ""}
              onChange={(e) => setQuantityChange(Number(e.target.value))}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              New stock will be: {Math.max(0, currentStock + (quantityChange || 0))}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Note (Optional)</label>
            <Textarea
              placeholder="e.g. Received from vendor"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || quantityChange === 0}>
            {loading ? "Updating..." : "Update Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
