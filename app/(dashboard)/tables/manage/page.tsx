import { getTables, getTableTypes } from "@/features/tables/services/table.service"
import { ManageAssetsClient } from "@/features/tables/components/ManageAssetsClient"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ManageTablesPage() {
  const [tables, tableTypes] = await Promise.all([getTables(), getTableTypes()])

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tables">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Manage Assets
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure physical tables, consoles, and their pricing types.
          </p>
        </div>
      </div>

      <ManageAssetsClient tables={tables} tableTypes={tableTypes} />
    </div>
  )
}
