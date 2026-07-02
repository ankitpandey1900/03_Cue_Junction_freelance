export default function TablesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-6 w-28 rounded-md bg-muted animate-pulse" />
          <div className="h-3.5 w-48 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-28 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      {/* Table type filters */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-muted animate-pulse" />
        ))}
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/40 p-4 space-y-2 animate-pulse">
            <div className="h-5 w-16 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted/60" />
            <div className="h-5 w-14 rounded-full bg-muted/60 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
