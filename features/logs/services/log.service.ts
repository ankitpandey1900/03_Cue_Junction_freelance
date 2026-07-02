import { ActivityLog } from "@prisma/client"
import prisma from "@/lib/prisma"

export async function getLogs(): Promise<(ActivityLog & { user: { name: string | null, email: string } })[]> {
  return await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    take: 200
  }) as any
}

// Helper to create a log (can be used anywhere in the app)
export async function logActivity(
  userId: string, 
  action: string, 
  entityType: string, 
  entityId: string, 
  metadata?: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata
      }
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}
