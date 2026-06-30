"use client"

import { useState } from "react"
import { TableWithDetails } from "../services/table.service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Customer } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { StartSessionDialog } from "@/features/sessions/components/StartSessionDialog"
import { useRouter } from "next/navigation"
import { Play, Eye, Search, SlidersHorizontal, Users, ShoppingBag, Settings } from "lucide-react"

interface TableGridProps {
  tables: TableWithDetails[]
  customers: Customer[]
  isAdmin?: boolean
}

export function TableGrid({ tables, customers, isAdmin = true }: TableGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<{
    id: string
    name: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("NAME_ASC")
  const router = useRouter()

  const handleStartSessionClick = (id: string, name: string) => {
    setSelectedTable({ id, name })
    setDialogOpen(true)
  }

  // Filter and sort tables
  const filteredAndSortedTables = tables
    .filter((table) => {
      const matchesSearch =
        table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.tableType.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "AVAILABLE" && table.status === "AVAILABLE") ||
        (statusFilter === "OCCUPIED" && table.status !== "AVAILABLE")

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "NAME_ASC") {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "NAME_DESC") {
        return b.name.localeCompare(a.name)
      }
      if (sortBy === "RATE_ASC") {
        return a.tableType.hourlyRate - b.tableType.hourlyRate
      }
      if (sortBy === "RATE_DESC") {
        return b.tableType.hourlyRate - a.tableType.hourlyRate
      }
      return 0
    })

  // Helper to determine capacity based on type name
  const getCapacityText = (typeName: string) => {
    const lower = typeName.toLowerCase()
    if (lower.includes("snooker")) return "6 Players max"
    if (lower.includes("console") || lower.includes("ps5")) return "2-4 Players"
    if (lower.includes("vip")) return "8 Players max"
    return "4 Players max"
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assets or types..."
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Status Select */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "ALL")}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-background/50 border-border">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? "NAME_ASC")}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background/50 border-border">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NAME_ASC">Name: A to Z</SelectItem>
              <SelectItem value="NAME_DESC">Name: Z to A</SelectItem>
              <SelectItem value="RATE_ASC">Rate: Low to High</SelectItem>
              <SelectItem value="RATE_DESC">Rate: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedTables.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No assets match your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredAndSortedTables.map((table) => {
            const isAvailable = table.status === "AVAILABLE"
            const activeSession = table.sessions?.find(s => s.status === "ACTIVE" || s.status === "PAUSED")

            return (
              <Card
                key={table.id}
                className="group transition-colors hover:border-border/80"
              >
                <CardContent className="p-4 flex flex-col h-full justify-between min-h-[170px]">
                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {table.name}
                        </p>
                        {/* Status dot */}
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            isAvailable ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[8px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md ${
                          isAvailable 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}
                      >
                        {table.status}
                      </Badge>
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground">
                      {table.tableType.name}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80 mt-2">
                      <span className="flex items-center gap-1 font-mono">
                        ₹{table.tableType.hourlyRate}/hr
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" />
                        {getCapacityText(table.tableType.name)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="pt-4 space-y-1.5">
                    {isAvailable ? (
                      <Button
                        onClick={() =>
                          handleStartSessionClick(table.id, table.name)
                        }
                        size="sm"
                        className="w-full h-8 text-xs gap-1.5"
                      >
                        <Play className="h-3 w-3" />
                        Start Play
                      </Button>
                    ) : (
                      <div className="flex gap-1.5 w-full">
                        <Button
                          onClick={() => router.push("/sessions")}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        {activeSession && (
                          <Button
                            onClick={() => router.push(`/pos?sessionId=${activeSession.id}`)}
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs gap-1"
                          >
                            <ShoppingBag className="h-3 w-3" />
                            + Food
                          </Button>
                        )}
                      </div>
                    )}

                    {isAdmin && (
                      <Button
                        onClick={() => router.push("/tables/manage")}
                        size="sm"
                        variant="ghost"
                        className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Settings className="h-3 w-3 mr-1" /> Configure Asset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedTable && (
        <StartSessionDialog
          tableId={selectedTable.id}
          tableName={selectedTable.name}
          customers={customers}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  )
}
