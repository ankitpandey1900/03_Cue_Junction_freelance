import { TableGrid } from "@/features/tables/components/TableGrid"
import { getTables } from "@/features/tables/services/table.service"
import { getCustomers } from "@/features/customers/services/customer.service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Settings2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function TablesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const isAdmin = session?.user?.role === "ADMIN"

  const tables = await getTables()
  const customers = await getCustomers()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Tables
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live status of your pool tables and consoles
          </p>
        </div>
        {isAdmin && (
          <Link href="/tables/manage">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" />
              Manage Assets
            </Button>
          </Link>
        )}
      </div>

      <TableGrid tables={tables} customers={customers} isAdmin={isAdmin} />
    </div>
  )
}
