export default function BookingsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-6 w-32 rounded-md bg-muted animate-pulse" />
          <div className="h-3.5 w-48 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="flex gap-2 border-b border-border mb-4 pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-muted/50 animate-pulse" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/40 p-4 space-y-3 animate-pulse">
             <div className="flex justify-between">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted/60" />
             </div>
             <div className="h-3 w-24 rounded bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
