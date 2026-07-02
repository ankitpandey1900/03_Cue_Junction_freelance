export default function InvoicesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-1.5">
        <div className="h-6 w-44 rounded-md bg-muted animate-pulse" />
        <div className="h-3.5 w-56 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Filters row */}
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-36 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/30 border-b border-border px-4 py-3 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 rounded bg-muted animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-border/50 grid grid-cols-5 gap-4 animate-pulse">
            <div className="h-4 rounded bg-muted/60" />
            <div className="h-4 rounded bg-muted/60 col-span-2" />
            <div className="h-4 rounded bg-muted/60" />
            <div className="h-5 w-16 rounded-full bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
