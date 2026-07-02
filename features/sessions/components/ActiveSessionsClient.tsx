"use client"

import { useState } from "react"
import { ActiveSessionCard, SessionWithDetails } from "./ActiveSessionCard"
import { Input } from "@/components/ui/input"
import { Search, Timer } from "lucide-react"

interface ActiveSessionsClientProps {
  sessions: SessionWithDetails[]
  availableTables: any[]
}

export function ActiveSessionsClient({ sessions, availableTables }: ActiveSessionsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSessions = sessions.filter((session) => {
    const tableMatch = session.table.name.toLowerCase().includes(searchQuery.toLowerCase())
    const customerMatch = session.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const phoneMatch = session.customer?.phone?.includes(searchQuery)
    return tableMatch || customerMatch || phoneMatch
  })

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search table, customer name or phone..."
          className="pl-9 h-9 text-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Timer className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            {sessions.length === 0 
              ? "No active sessions. Start one from the Tables page." 
              : `No active sessions found matching "${searchQuery}"`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSessions.map((session) => (
            <ActiveSessionCard key={session.id} session={session} availableTables={availableTables} />
          ))}
        </div>
      )}
    </div>
  )
}
