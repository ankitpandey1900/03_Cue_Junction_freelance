"use client"

import { useState, Fragment } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight, ScrollText, Calendar, Clock, User, Info, CheckCircle2, PauseCircle, PlayCircle, StopCircle } from "lucide-react"

interface LogRawItem {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata: string | null
  createdAt: Date
  user: { name: string | null; email: string }
}

interface AuditLogTableProps {
  initialLogs: LogRawItem[]
}

interface GroupedSessionLog {
  id: string
  entityId: string
  startTime: Date
  endTime: Date | null
  latestAction: string
  user: { name: string | null; email: string }
  tableName: string
  invoiceNumber?: number
  actions: LogRawItem[]
}

export function AuditLogTable({ initialLogs }: AuditLogTableProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // 1. Grouping Algorithm
  const displayRows: (
    | { type: "single"; log: LogRawItem }
    | { type: "grouped-session"; session: GroupedSessionLog }
  )[] = []

  const sessionGroups: Record<string, GroupedSessionLog> = {}

  // Since initialLogs is sorted desc (newest first), we process it sequentially
  for (const log of initialLogs) {
    if (log.entityType === "SESSION") {
      const sessionId = log.entityId
      let meta: any = {}
      try {
        if (log.metadata) meta = JSON.parse(log.metadata)
      } catch (e) {
        // Ignored
      }

      if (!sessionGroups[sessionId]) {
        // Initialize Group
        sessionGroups[sessionId] = {
          id: sessionId,
          entityId: sessionId,
          startTime: log.createdAt, // will be updated when we find STARTED
          endTime: log.action === "SESSION_ENDED" ? log.createdAt : null,
          latestAction: log.action, // first seen is the latest action
          user: log.user,
          tableName: meta.tableName || "Table",
          invoiceNumber: meta.invoiceNumber,
          actions: []
        }
        displayRows.push({ type: "grouped-session", session: sessionGroups[sessionId] })
      }

      // Add action to history
      sessionGroups[sessionId].actions.push(log)

      // Update timing bounds
      const logTime = new Date(log.createdAt)
      if (log.action === "SESSION_STARTED") {
        sessionGroups[sessionId].startTime = log.createdAt
      }
      if (log.action === "SESSION_ENDED") {
        sessionGroups[sessionId].endTime = log.createdAt
      }
    } else {
      // Normal single entries (e.g. INVOICE, SETTINGS, CUSTOMER)
      displayRows.push({ type: "single", log })
    }
  }

  // Helper formatting for action types
  function getActionDetails(action: string) {
    const display = action
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")

    if (action.includes("STARTED") || action.includes("ACTIVE") || action.includes("SUCCESS")) {
      return { text: display, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }
    }
    if (action.includes("ENDED") || action.includes("COMPLETED")) {
      return { text: display, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" }
    }
    if (action.includes("PAUSED")) {
      return { text: display, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" }
    }
    if (action.includes("RESUMED")) {
      return { text: display, color: "bg-teal-500/10 text-teal-500 border-teal-500/20" }
    }
    if (action.includes("DELETED") || action.includes("CANCELLED") || action.includes("VOIDED")) {
      return { text: display, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
    }
    return { text: display, color: "bg-muted text-muted-foreground border-border" }
  }

  function getContextDisplay(entityType: string, metadataString: string | null) {
    if (!metadataString) return entityType
    try {
      const meta = JSON.parse(metadataString)
      if (entityType === "INVOICE") {
        if (meta.invoiceNumber) return `Invoice #${meta.invoiceNumber}`
        return "Invoice"
      }
      if (entityType === "CUSTOMER") {
        if (meta.name) return `Customer: ${meta.name}`
        return "Customer Profile"
      }
      if (entityType === "USER" || entityType === "SETTINGS") {
        if (meta.email) return `Staff: ${meta.email}`
        return "System Settings"
      }
      return entityType
    } catch (e) {
      return entityType
    }
  }

  function getTimelineIcon(action: string) {
    switch (action) {
      case "SESSION_STARTED":
        return <PlayCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
      case "SESSION_PAUSED":
        return <PauseCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      case "SESSION_RESUMED":
        return <PlayCircle className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
      case "SESSION_ENDED":
        return <StopCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[48px]"></TableHead>
            <TableHead className="text-xs w-[180px]">Timestamp</TableHead>
            <TableHead className="text-xs w-[180px]">User</TableHead>
            <TableHead className="text-xs">Action Taken</TableHead>
            <TableHead className="text-xs">Context</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <ScrollText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No activity logs found.</p>
              </TableCell>
            </TableRow>
          ) : (
            displayRows.map((row, index) => {
              if (row.type === "grouped-session") {
                const { session } = row
                const isExpanded = !!expandedIds[session.id]
                const startedAction = session.actions.find(a => a.action === "SESSION_STARTED") || session.actions[session.actions.length - 1]
                const actionDetails = getActionDetails(session.endTime ? "SESSION_COMPLETED" : session.latestAction)

                // Subtitle summary of pauses
                const pauseCount = session.actions.filter(a => a.action === "SESSION_PAUSED").length
                const pauseLabel = pauseCount > 0 ? ` (${pauseCount} Pause${pauseCount > 1 ? "s" : ""})` : ""

                return (
                  <Fragment key={session.id}>
                    {/* Collapsed Group Header Row */}
                    <TableRow 
                      key={session.id} 
                      className={`hover:bg-accent/40 cursor-pointer transition-colors border-b border-border/40 ${isExpanded ? "bg-accent/15" : ""}`}
                      onClick={() => toggleExpand(session.id)}
                    >
                      <TableCell className="p-0 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm text-muted-foreground font-medium">
                        {format(new Date(startedAction.createdAt), "MMM d, yyyy - hh:mm a")}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm font-bold text-foreground">
                        {session.user.name || session.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] md:text-[11px] font-bold border px-2 py-0.5 rounded-md ${actionDetails.color}`}>
                          {actionDetails.text}
                          {pauseLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm text-muted-foreground font-medium">
                        {`Table: ${session.tableName}`}
                        {session.invoiceNumber && ` (Invoice #${session.invoiceNumber})`}
                      </TableCell>
                    </TableRow>

                    {/* Timeline Expansion Details Row */}
                    {isExpanded && (
                      <TableRow key={`${session.id}-expanded`} className="bg-accent/5 hover:bg-accent/5">
                        <TableCell colSpan={5} className="py-4 px-6 border-b border-border/50">
                          <div className="space-y-3.5 max-w-2xl">
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 text-primary" />
                              Play Session Lifecycle Timeline
                            </h4>
                            <div className="relative pl-5 border-l border-border/60 ml-2.5 space-y-4">
                              {session.actions.slice().reverse().map((act) => {
                                const actDetails = getActionDetails(act.action)
                                return (
                                  <div key={act.id} className="relative flex items-start gap-3">
                                    {/* Timeline Node dot */}
                                    <div className="absolute -left-[29px] bg-background p-0.5 rounded-full z-10">
                                      {getTimelineIcon(act.action)}
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-[9px] font-bold border px-1.5 py-0.2 rounded ${actDetails.color}`}>
                                          {actDetails.text}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          {format(new Date(act.createdAt), "hh:mm:ss a")}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                        <User className="h-3 w-3" />
                                        <span>Triggered by: <strong className="text-foreground">{act.user.name || act.user.email}</strong></span>
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              } else {
                // Non-session row
                const { log } = row
                const actionDetails = getActionDetails(log.action)
                const contextDisplay = getContextDisplay(log.entityType, log.metadata)

                return (
                  <TableRow key={log.id} className="hover:bg-accent/30 transition-colors border-b border-border/40">
                    <TableCell></TableCell> {/* Spacer */}
                    <TableCell className="text-xs md:text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, yyyy - hh:mm a")}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm font-bold text-foreground">
                      {log.user.name || log.user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] md:text-[11px] font-bold border px-2 py-0.5 rounded-md ${actionDetails.color}`}>
                        {actionDetails.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm text-muted-foreground">
                      {contextDisplay}
                    </TableCell>
                  </TableRow>
                )
              }
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
