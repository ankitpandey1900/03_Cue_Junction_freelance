"use server"

import prisma from "@/lib/prisma"
import { parseLabel } from "../services/history.service"

export type UnifiedTimelineItem = {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: string | null
  createdAt: Date
  actorName: string | null
  actorEmail: string
  label: string
  detail: string
}

export async function getUnifiedTimelineAction(entityId: string, entityType: string): Promise<UnifiedTimelineItem[]> {
  try {
    let invoiceId: string | null = null

    // Find the master invoice ID to group around
    if (entityType === "INVOICE") {
      invoiceId = entityId
    } else if (entityType === "SESSION") {
      const session = await prisma.session.findUnique({ where: { id: entityId }, select: { invoiceId: true } })
      if (session?.invoiceId) {
        invoiceId = session.invoiceId
      }
    } else if (entityType === "ORDER") {
      const order = await prisma.customerOrder.findUnique({ where: { id: entityId }, select: { invoiceId: true } })
      if (order?.invoiceId) {
        invoiceId = order.invoiceId
      }
    }

    let entityIdsToFetch = [entityId]

    // If we successfully found an invoice, grab all its children to make the unified timeline
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          sessions: { select: { id: true } },
          orders: { select: { id: true } }
        }
      })
      if (invoice) {
        entityIdsToFetch = [
          invoice.id,
          ...invoice.sessions.map((s: any) => s.id),
          ...invoice.orders.map((o: any) => o.id)
        ]
      }
    }

    // Now fetch all ActivityLogs for this entire unified group
    const logs = await prisma.activityLog.findMany({
      where: {
        entityId: { in: entityIdsToFetch }
      },
      orderBy: { createdAt: "asc" }, // Unified timeline is chronologically sorted (oldest first)
      include: { user: true }
    })

    return logs.map((log: any) => {
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
  } catch (error) {
    console.error("Failed to fetch unified timeline", error)
    return []
  }
}
