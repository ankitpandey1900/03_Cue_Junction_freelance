import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { getDateRange, HistoryFilter, parseLabel } from "@/features/logs/services/history.service"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user and verify Admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 2. Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const filter = (searchParams.get("filter") || "week") as HistoryFilter
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined
    const entity = searchParams.get("entity") || "all"

    // 3. Build query
    const dateRange = getDateRange(filter, from, to)
    const where: any = {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    }

    if (entity && entity !== "all") {
      where.entityType = entity.toUpperCase()
    }

    // 4. Fetch logs (no pagination limit)
    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // 5. Generate CSV
    const csvHeaders = [
      "Date",
      "Time",
      "Action",
      "Category",
      "Staff/User",
      "Details",
      "Metadata"
    ].join(",")

    const escapeCsv = (str: string) => {
      if (!str) return ""
      // If string contains comma, quote, or newline, wrap in quotes and escape quotes
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvRows = logs.map(log => {
      const date = format(new Date(log.createdAt), "yyyy-MM-dd")
      const time = format(new Date(log.createdAt), "HH:mm:ss")
      const action = log.action
      const category = log.entityType
      const user = log.user ? (log.user.name || log.user.email) : "System"
      
      const { detail } = parseLabel(log.action, log.entityType, log.metadata)
      const details = escapeCsv(detail || "")
      const metadata = escapeCsv(log.metadata || "")

      return [
        date,
        time,
        escapeCsv(action),
        escapeCsv(category),
        escapeCsv(user),
        details,
        metadata
      ].join(",")
    })

    const csvContent = [csvHeaders, ...csvRows].join("\n")

    // 6. Return File
    const filename = `history_export_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`
    
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Failed to export history:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
