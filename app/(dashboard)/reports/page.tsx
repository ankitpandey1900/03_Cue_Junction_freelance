import { getDashboardStats, parseReportRange } from "@/features/reports/services/report.service"
import { DashboardAnalytics } from "@/features/reports/components/DashboardAnalytics"
import { ReportFilters } from "@/features/reports/components/ReportFilters"
import { ExportButton } from "@/features/reports/components/ExportButton"
import { requireAdminPage } from "@/lib/action-auth"

export const dynamic = "force-dynamic"

type ReportsPageProps = {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireAdminPage()

  const params = await searchParams
  const range = parseReportRange(params.from, params.to, params.preset)
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

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <ExportButton stats={stats} />
            <ReportFilters />
          </div>
          
          <form className="flex flex-wrap items-center gap-2 lg:justify-end" action="/reports">
            <input
              type="date"
              name="from"
              defaultValue={stats.range.from}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              name="to"
              defaultValue={stats.range.to}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
            />
            <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition">
              Apply
            </button>
          </form>
        </div>
      </div>

      <DashboardAnalytics stats={stats} />
    </div>
  )
}
