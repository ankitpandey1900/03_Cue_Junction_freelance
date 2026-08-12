"use client"

import { Download } from "lucide-react"

export function ExportButton({ stats }: { stats: any }) {
  const handleExport = () => {
    // We will build a multi-section CSV string
    const rows = []

    // 1. Summary
    rows.push(["CUE JUNCTION CAFE - FINANCIAL REPORT"])
    rows.push(["Date Range", `${stats.range.label} (${stats.range.from} to ${stats.range.to})`])
    rows.push([])
    rows.push(["SUMMARY"])
    rows.push(["Money Collected (Rs)", stats.collectedRevenue])
    rows.push(["Total Billing (Rs)", stats.billedRevenue])
    rows.push(["Session Revenue (Rs)", stats.sessionRevenue])
    rows.push(["Cafe Revenue (Rs)", stats.cafeRevenue])
    rows.push(["Discounts (Rs)", stats.discountTotal])
    rows.push(["Pending Collection (Rs)", stats.pendingCollection])
    rows.push([])

    // 2. Payments Received By Staff
    rows.push(["PAYMENTS RECEIVED BY STAFF"])
    rows.push(["Staff Name", "Payments Processed", "Total Collected (Rs)"])
    if (stats.paymentsByStaff && stats.paymentsByStaff.length > 0) {
      stats.paymentsByStaff.forEach((staff: any) => {
        rows.push([staff.name, staff.count, staff.totalAmount])
      })
    } else {
      rows.push(["No payments collected by staff in this range."])
    }
    rows.push([])

    // 3. Payments List
    rows.push(["PAYMENTS LIST"])
    rows.push(["Date", "Invoice", "Method", "Amount (Rs)", "Processed By"])
    if (stats.paymentsList && stats.paymentsList.length > 0) {
      stats.paymentsList.forEach((p: any) => {
        rows.push([
          new Date(p.paidAt).toLocaleString(),
          p.invoiceNumber,
          p.method,
          p.amount,
          p.receivedByName || "Unknown"
        ])
      })
    } else {
      rows.push(["No payments in this range."])
    }
    rows.push([])

    // 4. Top Cafe Items
    rows.push(["TOP SELLING CAFE ITEMS"])
    rows.push(["Item Name", "Quantity Sold", "Total Revenue (Rs)"])
    if (stats.topSellingItems && stats.topSellingItems.length > 0) {
      stats.topSellingItems.forEach((item: any) => {
        rows.push([item.name, item.qty, item.total])
      })
    } else {
      rows.push(["No cafe orders in this range."])
    }
    rows.push([])

    // 5. Gaming Revenue
    rows.push(["GAMING REVENUE BY TABLE TYPE"])
    rows.push(["Table Type", "Sessions Played", "Total Revenue (Rs)"])
    if (stats.gamingRevenueByTableType && stats.gamingRevenueByTableType.length > 0) {
      stats.gamingRevenueByTableType.forEach((t: any) => {
        rows.push([t.name, t.sessionCount, t.totalRevenue])
      })
    } else {
      rows.push(["No gaming sessions in this range."])
    }
    rows.push([])

    // Convert to CSV string (handling basic escaping)
    const csvContent = rows.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return ""
        const str = String(cell)
        return str.includes(",") ? `"${str}"` : str
      }).join(",")
    ).join("\n")

    // Create a Blob and download it
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `cue_junction_report_${stats.range.from}_to_${stats.range.to}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleExport}
      className="flex h-8 items-center gap-1.5 rounded-md bg-secondary px-3 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
      title="Export to CSV / Excel"
    >
      <Download className="h-3.5 w-3.5" />
      Export
    </button>
  )
}
