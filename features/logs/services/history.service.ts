import prisma from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, startOfToday } from "date-fns"

export type HistoryFilter = "today" | "yesterday" | "week" | "month" | "all" | "custom"

export interface ActivityLogItem {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: string | null
  createdAt: Date
  actorName: string | null
  actorEmail: string
  // parsed from metadata
  label: string       // human-readable description e.g. "Invoice #11", "Aarav Mehta"
  detail: string      // extra detail e.g. "₹150 via Cash", "role: STAFF"
}

export interface ActivityResult {
  items: ActivityLogItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function getDateRange(filter: HistoryFilter, from?: string, to?: string): { from: Date; to: Date } {
  const today = startOfToday()
  switch (filter) {
    case "today":
      return { from: startOfDay(today), to: endOfDay(today) }
    case "yesterday":
      return { from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) }
    case "week":
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) }
    case "month":
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) }
    case "custom":
      return {
        from: from ? startOfDay(new Date(from)) : startOfDay(subDays(today, 29)),
        to: to ? endOfDay(new Date(to)) : endOfDay(today),
      }
    case "all":
    default:
      return { from: startOfDay(subDays(today, 365)), to: endOfDay(today) }
  }
}

export function parseLabel(action: string, entityType: string, metadataStr: string | null): { label: string; detail: string } {
  let meta: Record<string, any> = {}
  try {
    if (metadataStr) meta = JSON.parse(metadataStr)
  } catch { /* ignore */ }

  switch (entityType) {
    case "SESSION":
      return {
        label: meta.tableName ? `Table: ${meta.tableName}` : "Play Session",
        detail: meta.invoiceNumber ? `Invoice #${meta.invoiceNumber}` : "",
      }
    case "INVOICE":
      return {
        label: meta.invoiceNumber ? `Invoice #${meta.invoiceNumber}` : "Invoice",
        detail: meta.amount ? `₹${meta.amount} via ${meta.method ?? ""}` : "",
      }
    case "CUSTOMER":
      return {
        label: meta.name ? `Customer: ${meta.name}` : "Customer",
        detail: "",
      }
    case "USER":
      return {
        label: meta.email ? `Staff: ${meta.email}` : "Staff Account",
        detail: meta.role ? `Role: ${meta.role}` : "",
      }
    case "SETTINGS":
      return { label: "Cafe Settings", detail: "" }
    case "BOOKING":
      return {
        label: meta.customerName
          ? `${meta.customerName} → ${meta.tableName ?? ""}`
          : "Booking",
        detail: meta.status ?? "",
      }
    default:
      return { label: entityType, detail: "" }
  }
}

export async function getHistoryFeed(
  page: number = 1,
  filter: HistoryFilter = "week",
  from?: string,
  to?: string,
  entityFilter?: string
): Promise<ActivityResult> {
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const dateRange = getDateRange(filter, from, to)

  const where: any = {
    createdAt: {
      gte: dateRange.from,
      lte: dateRange.to,
    },
  }

  if (entityFilter && entityFilter !== "all") {
    where.entityType = entityFilter.toUpperCase()
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      } as any,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ])

  const items: ActivityLogItem[] = (logs as any[]).map((log) => {
    const { label, detail } = parseLabel(log.action, log.entityType, log.metadata)
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt,
      actorName: log.user?.name ?? null,
      actorEmail: log.user?.email ?? "",
      label,
      detail,
    }
  })

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
