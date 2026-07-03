export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/50 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-muted/80 animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-muted/50 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted/80 animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card/30 p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 w-24 rounded bg-muted/80 animate-pulse" />
                <div className="h-3 w-32 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted/40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
