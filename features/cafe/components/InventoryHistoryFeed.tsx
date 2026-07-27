"use client"

import { format } from "date-fns"
import { InventoryActivityLog } from "../services/history.service"
import { Package, PlusCircle, MinusCircle, Edit, Trash2, PackageCheck } from "lucide-react"

interface InventoryHistoryFeedProps {
  logs: InventoryActivityLog[]
}

function parseMetadata(metadataStr: string | null) {
  if (!metadataStr) return {}
  try {
    return JSON.parse(metadataStr)
  } catch (e) {
    return {}
  }
}

export function InventoryHistoryFeed({ logs }: InventoryHistoryFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Inventory History</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          There are no inventory changes recorded yet. When staff add or update stock, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {logs.map((log) => {
        const metadata = parseMetadata(log.metadata)
        const date = new Date(log.createdAt)
        const userName = log.user?.name || "Unknown User"
        const itemName = metadata.itemName || "Unknown Item"

        // Determine icon and color based on action
        let Icon = Package
        let colorClass = "text-muted-foreground"
        let bgClass = "bg-muted"
        let title = "Unknown Action"

        if (log.action === "STOCK_UPDATE") {
          title = "Stock Updated"
          if (metadata.change > 0) {
            Icon = PlusCircle
            colorClass = "text-emerald-500"
            bgClass = "bg-emerald-500/10"
          } else {
            Icon = MinusCircle
            colorClass = "text-rose-500"
            bgClass = "bg-rose-500/10"
          }
        } else if (log.action === "ITEM_CREATED") {
          Icon = PackageCheck
          colorClass = "text-blue-500"
          bgClass = "bg-blue-500/10"
          title = "New Item Created"
        } else if (log.action === "ITEM_UPDATED") {
          Icon = Edit
          colorClass = "text-amber-500"
          bgClass = "bg-amber-500/10"
          title = "Item Edited"
        } else if (log.action === "ITEM_DELETED" || log.action === "ITEM_DISABLED") {
          Icon = Trash2
          colorClass = "text-rose-500"
          bgClass = "bg-rose-500/10"
          title = "Item Removed"
        }

        return (
          <div key={log.id} className="relative pl-6 pb-6 border-l border-border/50 last:pb-0 last:border-l-transparent">
            {/* Timeline Dot */}
            <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${colorClass} ${bgClass}`} />
            
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                
                {/* Header Information */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${bgClass} ${colorClass} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {title}
                      <span className="text-muted-foreground font-normal">•</span>
                      <span className="text-primary">{itemName}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      By <span className="font-medium text-foreground">{userName}</span> on {format(date, "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>

                {/* Stock Changes Box */}
                {log.action === "STOCK_UPDATE" && (
                  <div className="bg-background/50 border border-border/50 rounded-lg p-2.5 shrink-0 flex items-center gap-4">
                    <div className="text-center px-2">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Previous</p>
                      <p className="text-sm font-mono font-medium">{metadata.previousStock}</p>
                    </div>
                    <div className="text-center px-2 border-l border-border/50">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Change</p>
                      <p className={`text-sm font-mono font-bold ${metadata.change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {metadata.change > 0 ? `+${metadata.change}` : metadata.change}
                      </p>
                    </div>
                    <div className="text-center px-2 border-l border-border/50">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">New</p>
                      <p className="text-sm font-mono font-bold">{metadata.newStock}</p>
                    </div>
                  </div>
                )}
                
                {log.action === "ITEM_CREATED" && (
                  <div className="bg-background/50 border border-border/50 rounded-lg p-2.5 shrink-0 flex items-center gap-4">
                    <div className="text-center px-2">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Initial Stock</p>
                      <p className="text-sm font-mono font-medium">{metadata.initialStock}</p>
                    </div>
                  </div>
                )}

              </div>

              {/* Note / Reason */}
              {metadata.note && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Note / Reason</p>
                  <p className="text-sm text-foreground bg-muted/20 p-2.5 rounded-md italic">
                    "{metadata.note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
