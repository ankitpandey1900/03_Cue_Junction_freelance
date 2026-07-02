export default function CafeLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-1.5">
        <div className="h-6 w-32 rounded-md bg-muted animate-pulse" />
        <div className="h-3.5 w-56 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse" />
        ))}
      </div>

      {/* Menu items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/40 p-4 space-y-3 animate-pulse">
            <div className="h-5 w-36 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted/60" />
            <div className="h-3 w-3/4 rounded bg-muted/60" />
            <div className="flex justify-between items-center pt-1">
              <div className="h-5 w-16 rounded bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
