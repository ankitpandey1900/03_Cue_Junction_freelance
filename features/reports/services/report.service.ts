import { subDays, format } from "date-fns"
import prisma from "@/lib/prisma"

export async function getDailyRevenue(days: number = 7) {
  const startDate = subDays(new Date(), days)
  
  // Get all paid invoices since startDate
  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: startDate },
      status: "PAID"
    },
    orderBy: { createdAt: 'asc' }
  })

  // Aggregate by date (YYYY-MM-DD)
  const grouped = invoices.reduce((acc, invoice) => {
    const dateStr = format(invoice.createdAt, 'MMM dd')
    if (!acc[dateStr]) {
      acc[dateStr] = 0
    }
    acc[dateStr] += invoice.grandTotal
    return acc
  }, {} as Record<string, number>)

  // Ensure all last N days have an entry (even if 0)
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const dateStr = format(d, 'MMM dd')
    result.push({
      date: dateStr,
      revenue: grouped[dateStr] || 0
    })
  }

  return result
}

export async function getDashboardStats() {
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)
  const thirtyDaysAgo = subDays(now, 30)

  // Invoices metrics
  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    include: { payments: true }
  })

  const totalInvoicesCount = invoices.length
  const totalRevenue = invoices
    .filter(inv => inv.status === "PAID" || inv.status === "PARTIAL")
    .reduce((sum, inv) => sum + inv.grandTotal, 0)
  
  const avgOrderValue = totalInvoicesCount > 0 ? totalRevenue / totalInvoicesCount : 0

  // Active Sessions
  const activeSessionsCount = await prisma.session.count({
    where: { status: { in: ["ACTIVE", "PAUSED"] } }
  })

  // Table Occupancy
  const tables = await prisma.table.findMany({ where: { isArchived: false } })
  const totalTables = tables.length
  const occupiedTables = tables.filter(t => t.status === "OCCUPIED" || t.status === "PAUSED").length
  const availableTables = totalTables - occupiedTables

  // Top Selling Items (from CustomerOrderItem snapshots)
  const orderItems = await prisma.customerOrderItem.findMany({
    take: 200
  })
  
  // Aggregate top-selling items
  const itemCounts = orderItems.reduce((acc, item) => {
    if (!acc[item.itemNameSnapshot]) {
      acc[item.itemNameSnapshot] = { name: item.itemNameSnapshot, qty: 0, total: 0 }
    }
    acc[item.itemNameSnapshot].qty += item.quantity
    acc[item.itemNameSnapshot].total += item.totalPrice
    return acc
  }, {} as Record<string, { name: string, qty: number, total: number }>)

  const topSellingItems = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Best Selling Categories
  const categoryCounts = orderItems.reduce((acc, item) => {
    if (!acc[item.categorySnapshot]) {
      acc[item.categorySnapshot] = { name: item.categorySnapshot, qty: 0 }
    }
    acc[item.categorySnapshot].qty += item.quantity
    return acc
  }, {} as Record<string, { name: string, qty: number }>)

  const bestSellingCategories = Object.values(categoryCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Orders by Hour (Today)
  const todayStart = new Date()
  todayStart.setHours(0,0,0,0)
  
  const todayInvoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: todayStart } }
  })

  const hourlySales = Array.from({ length: 12 }, (_, i) => {
    const hour24 = i * 2 + 8 // 8:00 AM to 10:00 PM
    return { hour: `${hour24}:00`, amount: 0 }
  })

  todayInvoices.forEach(inv => {
    const hr = new Date(inv.createdAt).getHours()
    const bucket = Math.min(11, Math.max(0, Math.floor((hr - 8) / 2)))
    if (hr >= 8 && hr <= 22) {
      hourlySales[bucket].amount += inv.grandTotal
    }
  })

  // Customer Count
  const totalCustomers = await prisma.customer.count()

  // Weekly Revenue Aggregations (Last 7 Days)
  const dailyRev = await getDailyRevenue(7)

  // Map raw invoices for client-side filter computation
  const rawInvoices = invoices.map((inv) => ({
    id: inv.id,
    sessionTotal: inv.sessionTotal,
    cafeTotal: inv.cafeTotal,
    grandTotal: inv.grandTotal,
    createdAt: inv.createdAt.toISOString(),
    status: inv.status
  }))

  return {
    totalRevenue,
    avgOrderValue,
    activeSessionsCount,
    occupiedTables,
    availableTables,
    totalTables,
    topSellingItems,
    bestSellingCategories,
    hourlySales,
    totalCustomers,
    dailyRevenue: dailyRev,
    rawInvoices,
  }
}
