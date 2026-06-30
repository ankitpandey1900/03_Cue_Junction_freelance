import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAllMenuItems } from "@/features/pos/services/item.service"
import { getAllCategories } from "@/features/pos/services/category.service"
import { MenuItemManager } from "@/features/pos/components/MenuItemManager"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ManageMenuItemsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "ADMIN") {
    redirect("/pos")
  }

  const [menuItems, categories] = await Promise.all([
    getAllMenuItems(),
    getAllCategories()
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/pos">
              <Button variant="ghost" size="icon" className="h-7 w-7 border border-border/20">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xs text-muted-foreground font-mono">Back to POS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Menu Item Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your cafe menu products, prices, and settings.
          </p>
        </div>
      </div>

      <MenuItemManager menuItems={menuItems} categories={categories} />
    </div>
  )
}
