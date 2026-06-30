import { getDashboardStats } from "@/features/reports/services/report.service"
import { DashboardAnalytics } from "@/features/reports/components/DashboardAnalytics"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const stats = await getDashboardStats()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Financial Reports &amp; Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Detailed overview of play sessions, cafe revenue, and operational averages.
        </p>
      </div>

      <DashboardAnalytics stats={stats} />
    </div>
  )
}
