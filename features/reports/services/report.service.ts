import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isValid, parseISO, startOfDay, subDays } from "date-fns"
import prisma from "@/lib/prisma"

export type ReportDateRange = {
  from: Date
  to: Date
}

export function getDefaultReportRange(): ReportDateRange {
  const today = startOfDay(new Date())
  return {
    from: subDays(today, 29),
    to: today,
  }
}

export function parseReportRange(from?: string, to?: string): ReportDateRange {
  const fallback = getDefaultReportRange()
  const parsedFrom = from ? parseISO(from) : fallback.from
  const parsedTo = to ? parseISO(to) : fallback.to

  const safeFrom = isValid(parsedFrom) ? startOfDay(parsedFrom) : fallback.from
  const safeTo = isValid(parsedTo) ? startOfDay(parsedTo) : fallback.to

  if (safeFrom > safeTo) {
    return fallback
  }

  return { from: safeFrom, to: safeTo }
}

export async function getDashboardStats(range: ReportDateRange = getDefaultReportRange()) {
  const from = startOfDay(range.from)
  const to = startOfDay(range.to)
  const exclusiveTo = addDays(to, 1)
  const dateWhere = { gte: from, lt: exclusiveTo }

  const [invoices, payments, activeSessionsCount, tables, orderItems, totalCustomers] = await Promise.all([
    prisma.invoice.findMany({
      where: { createdAt: dateWhere, isArchived: false } as any,
      include: { payments: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.findMany({
      where: { paidAt: dateWhere, invoice: { isArchived: false } } as any,
      orderBy: { paidAt: "asc" },
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
    const hour24 = index * 2 + 8
    const amount = payments
      .filter((payment) => {
        const hour = payment.paidAt.getHours()
        return hour >= hour24 && hour < hour24 + 2
      })
      .reduce((sum, payment) => sum + payment.amount, 0)

    return { hour: `${hour24}:00`, amount }
  })

  return {
    range: {
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      label: `${format(from, "MMM dd, yyyy")} - ${format(to, "MMM dd, yyyy")}`,
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
  }
}
