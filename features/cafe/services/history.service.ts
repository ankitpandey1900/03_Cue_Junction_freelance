import prisma from "@/lib/prisma"

export type InventoryActivityLog = {
  id: string
  action: string
  metadata: string | null
  createdAt: Date
  user: {
    name: string | null
  }
}

export async function getInventoryHistory(): Promise<InventoryActivityLog[]> {
  return await prisma.activityLog.findMany({
    where: {
      entityType: "MENU_ITEM"
    },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100 // Limit to latest 100 entries for performance
  })
}
