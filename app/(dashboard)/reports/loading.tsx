export default function ReportsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-6 w-36 rounded-md bg-muted animate-pulse" />
          <div className="h-3.5 w-52 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/40 p-4 space-y-2 animate-pulse">
            <div className="h-3 w-20 rounded bg-muted/60" />
            <div className="h-7 w-28 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-border bg-card/40 p-4 h-72 animate-pulse" />
        <div className="rounded-xl border border-border bg-card/40 p-4 h-72 animate-pulse" />
      </div>
    </div>
  )
}
