import { getHistoryFeed, type HistoryFilter } from "@/features/logs/services/history.service"
import { HistoryFeed } from "@/features/logs/components/HistoryFeed"
import { requireAdminPage } from "@/lib/action-auth"
import { ScrollText, Download } from "lucide-react"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ filter?: string; page?: string; from?: string; to?: string; entity?: string; q?: string }>
}

export default async function LogsPage({ searchParams }: PageProps) {
  await requireAdminPage()

  const params = await searchParams
  const filter = (params.filter ?? "week") as HistoryFilter
  const entity = params.entity || "all"
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const from = params.from
  const to = params.to
  const q = params.q

  const result = await getHistoryFeed(page, filter, from, to, entity, q)

  const exportParams = new URLSearchParams()
  if (filter) exportParams.set("filter", filter)
  if (entity) exportParams.set("entity", entity)
  if (from) exportParams.set("from", from)
  if (to) exportParams.set("to", to)
  if (q) exportParams.set("q", q)
  const exportUrl = `/api/export/history?${exportParams.toString()}`

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Session History
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse completed sessions, payments, and billing records.
          </p>
        </div>
        <a href={exportUrl} download>
          <button className="h-9 px-4 rounded-md border border-border bg-card text-foreground text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition flex items-center gap-2 shadow-sm">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </a>
      </div>

      <HistoryFeed
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentFilter={filter}
        currentEntity={entity}
        customFrom={from}
        customTo={to}
        currentQuery={q}
      />
    </div>
  )
}
