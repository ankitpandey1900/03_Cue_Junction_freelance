import { getHistoryFeed, type HistoryFilter } from "@/features/logs/services/history.service"
import { HistoryFeed } from "@/features/logs/components/HistoryFeed"
import { requireAdminPage } from "@/lib/action-auth"
import { ScrollText } from "lucide-react"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ filter?: string; page?: string; from?: string; to?: string }>
}

export default async function LogsPage({ searchParams }: PageProps) {
  await requireAdminPage()

  const params = await searchParams
  const filter = (params.filter ?? "week") as HistoryFilter
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const from = params.from
  const to = params.to

  const result = await getHistoryFeed(page, filter, from, to)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          Session History
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Browse completed sessions, payments, and billing records.
        </p>
      </div>

      <HistoryFeed
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentFilter={filter}
        customFrom={from}
        customTo={to}
      />
    </div>
  )
}
