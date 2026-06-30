import { ActivityLog } from "@prisma/client"
import prisma from "@/lib/prisma"

export async function getLogs(): Promise<(ActivityLog & { user: { name: string | null, email: string } })[]> {
  return await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    take: 100 // Limit to recent 100 logs for performance
  })
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
