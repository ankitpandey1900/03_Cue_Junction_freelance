import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAllCategories } from "@/features/pos/services/category.service"
import { CategoryManager } from "@/features/pos/components/CategoryManager"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ManageCategoriesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "ADMIN") {
    redirect("/pos")
  }

  const categories = await getAllCategories()

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
            Category Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and sort menu categories.
          </p>
        </div>
      </div>

      <CategoryManager categories={categories} />
    </div>
  )
}
