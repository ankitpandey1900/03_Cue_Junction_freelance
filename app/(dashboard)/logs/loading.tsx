export default function LogsLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1.5">
        <div className="h-6 w-36 rounded-md bg-muted animate-pulse" />
        <div className="h-3.5 w-52 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/30 border-b border-border px-4 py-3 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3.5 rounded bg-muted animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-border/50 grid grid-cols-4 gap-4 animate-pulse">
            <div className="h-4 rounded bg-muted/60" />
            <div className="h-4 rounded bg-muted/60" />
            <div className="h-5 w-20 rounded-full bg-muted/60" />
            <div className="h-4 w-28 rounded bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
