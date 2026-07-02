export default function SessionsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-6 w-40 rounded-md bg-muted animate-pulse" />
          <div className="h-3.5 w-64 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="h-8 w-36 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="h-9 w-72 rounded-md bg-muted animate-pulse" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/40 p-4 space-y-3 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted/60" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
            <div className="h-10 w-full rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded bg-muted" />
              <div className="h-8 flex-1 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
