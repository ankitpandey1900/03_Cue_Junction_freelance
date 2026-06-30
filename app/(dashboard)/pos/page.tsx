import { getMenu } from "@/features/pos/services/pos.service"
import { getActiveSessions } from "@/features/sessions/services/session.service"
import { POSMenu } from "@/features/pos/components/POSMenu"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FolderKanban, Utensils } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function POSPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>
}) {
  const { sessionId } = await searchParams
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const isAdmin = session?.user?.role === "ADMIN"

  const [menuItems, activeSessions] = await Promise.all([
    getMenu(),
    getActiveSessions()
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Point of Sale
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage cafe orders, snacks, and drinks.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <Link href="/pos/manage/categories">
              <Button variant="outline" size="sm" className="gap-2 border-border/50 text-xs font-semibold h-9 rounded-lg">
                <FolderKanban className="h-4 w-4" />
                Manage Categories
              </Button>
            </Link>
            <Link href="/pos/manage/items">
              <Button variant="outline" size="sm" className="gap-2 border-border/50 text-xs font-semibold h-9 rounded-lg">
                <Utensils className="h-4 w-4" />
                Manage Menu Items
              </Button>
            </Link>
          </div>
        )}
      </div>

      <POSMenu menuItems={menuItems} activeSessions={activeSessions} initialSessionId={sessionId} />
    </div>
  )
}
