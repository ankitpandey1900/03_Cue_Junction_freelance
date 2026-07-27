import prisma from "@/lib/prisma"
import { subDays } from "date-fns"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"

const SYSTEM_TIMEZONE = "Asia/Kolkata"

export type HistoryFilter = "today" | "yesterday" | "week" | "month" | "all" | "custom"

// Helper to get midnight in IST
function getMidnightIST(dateOrString: Date | string): Date {
  const dStr = typeof dateOrString === 'string' 
    ? dateOrString.split('T')[0] 
    : formatInTimeZone(dateOrString, SYSTEM_TIMEZONE, "yyyy-MM-dd")
  return fromZonedTime(`${dStr}T00:00:00`, SYSTEM_TIMEZONE)
}

// Helper to get end of day in IST
function getEndOfDayIST(dateOrString: Date | string): Date {
  const dStr = typeof dateOrString === 'string' 
    ? dateOrString.split('T')[0] 
    : formatInTimeZone(dateOrString, SYSTEM_TIMEZONE, "yyyy-MM-dd")
  return fromZonedTime(`${dStr}T23:59:59.999`, SYSTEM_TIMEZONE)
}

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
  const today = new Date()
  switch (filter) {
    case "today":
      return { from: getMidnightIST(today), to: getEndOfDayIST(today) }
    case "yesterday":
      return { from: getMidnightIST(subDays(today, 1)), to: getEndOfDayIST(subDays(today, 1)) }
    case "week":
      return { from: getMidnightIST(subDays(today, 6)), to: getEndOfDayIST(today) }
    case "month":
      return { from: getMidnightIST(subDays(today, 29)), to: getEndOfDayIST(today) }
    case "custom":
      return {
        from: from ? getMidnightIST(from) : getMidnightIST(subDays(today, 29)),
        to: to ? getEndOfDayIST(to) : getEndOfDayIST(today),
      }
    case "all":
    default:
      return { from: getMidnightIST(subDays(today, 365)), to: getEndOfDayIST(today) }
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
      const tName = meta.tableNames ? ` (${meta.tableNames})` : ""
      const cName = meta.customerName ? ` - ${meta.customerName}` : ""
      return {
        label: meta.invoiceNumber ? `Invoice #${meta.invoiceNumber}${cName}${tName}` : `Invoice${cName}${tName}`,
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
    case "MENU_ITEM":
      return {
        label: meta.itemName ? `Cafe Item: ${meta.itemName}` : "Cafe Inventory",
        detail: meta.change !== undefined 
          ? `Stock changed by ${meta.change > 0 ? '+' : ''}${meta.change}` 
          : "",
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
  entityFilter?: string,
  searchQuery?: string
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

  const q = searchQuery?.trim().toLowerCase()

  if (q) {
    // In-memory search for accurate matching on computed labels
    const allLogs = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } } as any,
      orderBy: { createdAt: "desc" },
      take: 2000,
    })

    const parsedItems: ActivityLogItem[] = (allLogs as any[]).map((log) => {
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

    const filteredItems = parsedItems.filter(item => 
      item.label.toLowerCase().includes(q) ||
      (item.detail && item.detail.toLowerCase().includes(q)) ||
      (item.actorName && item.actorName.toLowerCase().includes(q)) ||
      (item.actorEmail && item.actorEmail.toLowerCase().includes(q)) ||
      item.action.toLowerCase().includes(q)
    )

    return {
      items: filteredItems.slice(skip, skip + pageSize),
      total: filteredItems.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    }
  }

  // Standard fast pagination without search
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } } as any,
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
