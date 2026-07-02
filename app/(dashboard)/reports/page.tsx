import { getDashboardStats, parseReportRange } from "@/features/reports/services/report.service"
import { DashboardAnalytics } from "@/features/reports/components/DashboardAnalytics"
import { requireAdminPage } from "@/lib/action-auth"

export const dynamic = "force-dynamic"

type ReportsPageProps = {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireAdminPage()

  const params = await searchParams
  const range = parseReportRange(params.from, params.to)
  const stats = await getDashboardStats(range)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Financial Reports &amp; Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filter collections, bills, play revenue, cafe sales, and pending customer dues by date.
          </p>
        </div>

        <form className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-2 sm:flex sm:items-end" action="/reports">
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</span>
            <input
              type="date"
              name="from"
              defaultValue={stats.range.from}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</span>
            <input
              type="date"
              name="to"
              defaultValue={stats.range.to}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none"
            />
          </label>
          <button className="col-span-2 h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground sm:col-span-1">
            Apply Filter
          </button>
        </form>
      </div>

      <DashboardAnalytics stats={stats} />
    </div>
  )
}
