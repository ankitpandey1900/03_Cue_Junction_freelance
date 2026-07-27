"use client"

import { Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

const FILTERS = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week",      label: "Last 7 Days" },
  { value: "month",     label: "Last 30 Days" },
  { value: "all",       label: "All Time" },
]

export function ReportFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get("preset") || (searchParams.has("from") ? "" : "today")

  const applyPreset = (preset: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("preset", preset)
    
    // Clear explicit from/to when using a preset
    params.delete("from")
    params.delete("to")

    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => applyPreset(f.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            currentFilter === f.value && !searchParams.has("from")
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
