import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
        Loading...
      </p>
    </div>
  )
}
