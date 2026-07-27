import { requireAdminPage } from "@/lib/action-auth"
import { getInventoryHistory } from "@/features/cafe/services/history.service"
import { InventoryHistoryFeed } from "@/features/cafe/components/InventoryHistoryFeed"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CafeHistoryPage() {
  await requireAdminPage("/cafe")

  const logs = await getInventoryHistory()

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/cafe">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory History</h1>
            <p className="text-sm text-muted-foreground mt-1">Audit log of all stock changes and menu updates</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm">
        <InventoryHistoryFeed logs={logs} />
      </div>
    </div>
  )
}
