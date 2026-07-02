import { requireAdminPage } from "@/lib/action-auth"
import { getAllMenuItems } from "@/features/cafe/services/item.service"
import { getAllCategories } from "@/features/cafe/services/category.service"
import { MenuItemManager } from "@/features/cafe/components/MenuItemManager"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ManageMenuItemsPage() {
  await requireAdminPage("/cafe")

  const [items, categories] = await Promise.all([
    getAllMenuItems(),
    getAllCategories()
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cafe">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Menu Items</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage cafe menu offerings</p>
          </div>
        </div>
      </div>

      <MenuItemManager menuItems={items} categories={categories} />
    </div>
  )
}
