import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isValid, parseISO, subDays } from "date-fns"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import prisma from "@/lib/prisma"

const SYSTEM_TIMEZONE = "Asia/Kolkata"

export type ReportDateRange = {
  from: Date
  to: Date
}

export function getDefaultReportRange(): ReportDateRange {
  // Always calculate "today" according to the cafe's physical timezone, never UTC
  const todayStr = formatInTimeZone(new Date(), SYSTEM_TIMEZONE, "yyyy-MM-dd")
  const to = fromZonedTime(`${todayStr}T00:00:00`, SYSTEM_TIMEZONE)
  
  return {
    from: subDays(to, 29),
    to,
  }
}

export function parseReportRange(from?: string, to?: string): ReportDateRange {
  const fallback = getDefaultReportRange()
  
  let safeFrom = fallback.from
  let safeTo = fallback.to

  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    safeFrom = fromZonedTime(`${from}T00:00:00`, SYSTEM_TIMEZONE)
  }
  
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    safeTo = fromZonedTime(`${to}T00:00:00`, SYSTEM_TIMEZONE)
  }

  if (safeFrom > safeTo) {
    return fallback
  }

  return { from: safeFrom, to: safeTo }
}

export async function getDashboardStats(range: ReportDateRange = getDefaultReportRange()) {
  const from = range.from
  const to = range.to
  const exclusiveTo = addDays(to, 1)
  const dateWhere = { gte: from, lt: exclusiveTo }

  const [invoices, payments, activeSessionsCount, tables, orderItems, totalCustomers] = await Promise.all([
    prisma.invoice.findMany({
      where: { createdAt: dateWhere, isArchived: false } as any,
      include: { payments: true, sessions: { include: { table: { include: { tableType: true } } } } } as any,
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.findMany({
      where: { paidAt: dateWhere, invoice: { isArchived: false } } as any,
      orderBy: { paidAt: "asc" },
      include: { receivedBy: { select: { name: true, id: true } }, invoice: { select: { invoiceNumber: true, id: true } } } as any
    }),
    prisma.session.count({
      where: { status: { in: ["ACTIVE", "PAUSED"] } },
    }),
    prisma.table.findMany({ where: { isArchived: false } }),
    prisma.customerOrderItem.findMany({
      where: {
        order: {
          createdAt: dateWhere,
          status: { not: "CANCELLED" },
          OR: [
            { invoiceId: null },
            { invoice: { isArchived: false } }
          ]
        },
      },
      take: 500,
    }),
    prisma.customer.count({ where: { isArchived: false } as any }),
  ])

  const billableInvoices = invoices.filter((invoice) => invoice.status !== "CANCELLED")
  const collectedRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const billedRevenue = billableInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0)
  const sessionRevenue = billableInvoices.reduce((sum, invoice) => sum + invoice.sessionTotal, 0)
  const cafeRevenue = billableInvoices.reduce((sum, invoice) => sum + invoice.cafeTotal, 0)
  const discountTotal = billableInvoices.reduce((sum, invoice) => sum + invoice.discountAmount, 0)

  const openInvoices = billableInvoices.filter((invoice) => invoice.status === "UNPAID" || invoice.status === "PARTIAL")
  const pendingCollection = openInvoices.reduce((sum, invoice: any) => {
    const paid = invoice.payments.reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0)
    return sum + Math.max(0, invoice.grandTotal - paid)
  }, 0)

  const paidInvoicesCount = billableInvoices.filter((invoice) => invoice.status === "PAID").length
  const partialInvoicesCount = billableInvoices.filter((invoice) => invoice.status === "PARTIAL").length
  const unpaidInvoicesCount = billableInvoices.filter((invoice) => invoice.status === "UNPAID").length
  const avgBillValue = billableInvoices.length > 0 ? billedRevenue / billableInvoices.length : 0
  const collectionRate = billedRevenue > 0 ? Math.min(100, (collectedRevenue / billedRevenue) * 100) : 0

  const totalTables = tables.length
  const occupiedTables = tables.filter((table) => table.status === "OCCUPIED" || table.status === "PAUSED").length
  const reservedTables = tables.filter((table) => table.status === "RESERVED").length
  const availableTables = Math.max(0, totalTables - occupiedTables - reservedTables)

  const itemCounts = orderItems.reduce((acc, item) => {
    if (!acc[item.itemNameSnapshot]) {
      acc[item.itemNameSnapshot] = { name: item.itemNameSnapshot, qty: 0, total: 0 }
    }
    acc[item.itemNameSnapshot].qty += item.quantity
    acc[item.itemNameSnapshot].total += item.totalPrice
    return acc
  }, {} as Record<string, { name: string; qty: number; total: number }>)

  const categoryCounts = orderItems.reduce((acc, item) => {
    if (!acc[item.categorySnapshot]) {
      acc[item.categorySnapshot] = { name: item.categorySnapshot, qty: 0 }
    }
    acc[item.categorySnapshot].qty += item.quantity
    return acc
  }, {} as Record<string, { name: string; qty: number }>)

  const topSellingItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 5)
  const bestSellingCategories = Object.values(categoryCounts).sort((a, b) => b.qty - a.qty).slice(0, 5)

  const daySpan = Math.max(1, differenceInCalendarDays(to, from) + 1)
  const dailySales = eachDayOfInterval({ start: from, end: to }).map((day) => {
    const dayKey = format(day, "yyyy-MM-dd")
    const label = daySpan > 45 ? format(day, "MMM d") : format(day, "MMM dd")
    const dayInvoices = billableInvoices.filter((invoice) => format(invoice.createdAt, "yyyy-MM-dd") === dayKey)
    const dayPayments = payments.filter((payment) => format(payment.paidAt, "yyyy-MM-dd") === dayKey)

    return {
      name: label,
      sessions: dayInvoices.reduce((sum, invoice) => sum + invoice.sessionTotal, 0),
      cafe: dayInvoices.reduce((sum, invoice) => sum + invoice.cafeTotal, 0),
      collected: dayPayments.reduce((sum, payment) => sum + payment.amount, 0),
    }
  })

  const hourlySales = Array.from({ length: 12 }, (_, index) => {
    const startHour = index * 2
    const label = `${String(startHour).padStart(2, '0')}:00`
    const amount = payments
      .filter((payment) => {
        const hour = payment.paidAt.getHours()
        return hour >= startHour && hour < startHour + 2
      })
      .reduce((sum, payment) => sum + payment.amount, 0)

    return { hour: label, amount }
  })

  // Group payments by staff
  const paymentsByStaffMap = new Map<string, { id: string, name: string, totalAmount: number, count: number }>()
  payments.forEach((p: any) => {
    const staffId = p.receivedById || "unknown"
    const staffName = p.receivedBy?.name || "System/Unknown"
    if (!paymentsByStaffMap.has(staffId)) {
      paymentsByStaffMap.set(staffId, { id: staffId, name: staffName, totalAmount: 0, count: 0 })
    }
    const st = paymentsByStaffMap.get(staffId)!
    st.totalAmount += p.amount
    st.count += 1
  })
  const paymentsByStaff = Array.from(paymentsByStaffMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)

  // Payments List
  const paymentsList = payments.map((p: any) => ({
    id: p.id,
    amount: p.amount,
    method: p.method,
    paidAt: p.paidAt,
    invoiceId: p.invoice?.id || p.invoiceId,
    invoiceNumber: p.invoice?.invoiceNumber || 0,
    receivedByName: p.receivedBy?.name || "Unknown",
    receivedById: p.receivedById || null
  }))

  // Calculate gaming revenue by table type
  const tableTypeRevenueMap = new Map<string, { id: string, name: string, totalRevenue: number, sessionCount: number }>()
  
  for (const invoice of billableInvoices) {
    const inv = invoice as any
    if (inv.sessions && inv.sessions.length > 0) {
      // Re-run the cost grouping logic for the invoice's sessions to know exact cost per table type
      const grouped = new Map<string, { tableType: any, totalMinutes: number, totalExtraCharges: number }>()
      for (const session of inv.sessions) {
        const typeId = session.table.tableType.id
        const end = session.endTime ? session.endTime.getTime() : new Date().getTime()
        let mins = Math.floor((end - session.startTime.getTime()) / 60000)
        mins -= Math.floor(session.totalPauseDurationSeconds / 60)
        if (mins < 1) mins = 1
        
        if (!grouped.has(typeId)) {
          grouped.set(typeId, { tableType: session.table.tableType, totalMinutes: 0, totalExtraCharges: 0 })
        }
        const group = grouped.get(typeId)!
        group.totalMinutes += mins
        group.totalExtraCharges += session.extraCharges
      }
      
      for (const group of grouped.values()) {
        const type = group.tableType
        let cost = 0
        if (type.fixedRate != null && type.fixedDuration != null && type.fixedDuration > 0) {
          if (group.totalMinutes <= type.fixedDuration) {
            cost = type.fixedRate
          } else {
            const extraMinutes = group.totalMinutes - type.fixedDuration
            const applicableHourlyRate = type.overtimeHourlyRate ?? type.hourlyRate
            cost = type.fixedRate + (extraMinutes / 60) * applicableHourlyRate
          }
        } else {
          cost = (group.totalMinutes / 60) * type.hourlyRate
        }
        if (cost < type.minimumCharge) cost = type.minimumCharge
        
        const finalCost = cost + group.totalExtraCharges
        
        if (!tableTypeRevenueMap.has(type.id)) {
          tableTypeRevenueMap.set(type.id, { id: type.id, name: type.name, totalRevenue: 0, sessionCount: 0 })
        }
        const st = tableTypeRevenueMap.get(type.id)!
        st.totalRevenue += finalCost
        st.sessionCount += 1
      }
    }
  }
  
  const gamingRevenueByTableType = Array.from(tableTypeRevenueMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)

  return {
    range: {
      from: formatInTimeZone(from, SYSTEM_TIMEZONE, "yyyy-MM-dd"),
      to: formatInTimeZone(to, SYSTEM_TIMEZONE, "yyyy-MM-dd"),
      label: `${formatInTimeZone(from, SYSTEM_TIMEZONE, "MMM dd, yyyy")} - ${formatInTimeZone(to, SYSTEM_TIMEZONE, "MMM dd, yyyy")}`,
    },
    collectedRevenue,
    billedRevenue,
    sessionRevenue,
    cafeRevenue,
    discountTotal,
    pendingCollection,
    collectionRate,
    invoicesCount: billableInvoices.length,
    paidInvoicesCount,
    partialInvoicesCount,
    unpaidInvoicesCount,
    avgBillValue,
    activeSessionsCount,
    occupiedTables,
    reservedTables,
    availableTables,
    totalTables,
    topSellingItems,
    bestSellingCategories,
    hourlySales,
    totalCustomers,
    dailySales,
    paymentsByStaff,
    paymentsList,
    gamingRevenueByTableType,
  }
}
