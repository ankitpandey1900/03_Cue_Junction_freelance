import { getActiveSessions } from "@/features/sessions/services/session.service"
import { getTables } from "@/features/tables/services/table.service"
import { ActiveSessionsClient } from "@/features/sessions/components/ActiveSessionsClient"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SessionsPage() {
  const [sessions, allTables] = await Promise.all([
    getActiveSessions(),
    getTables()
  ])
  const availableTables = allTables.filter((t) => t.status === "AVAILABLE")

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Active Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live tracking of currently playing customers
          </p>
        </div>
        <Link href="/tables">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Start New Session
          </Button>
        </Link>
      </div>

      <ActiveSessionsClient sessions={sessions} availableTables={availableTables} />
    </div>
  )
}
