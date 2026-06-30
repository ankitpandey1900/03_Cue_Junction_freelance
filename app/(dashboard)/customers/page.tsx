import { CustomerList } from "@/features/customers/components/CustomerList"
import { getCustomers } from "@/features/customers/services/customer.service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserPlus } from "lucide-react"

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your cafe and gaming customers
          </p>
        </div>
        <Link href="/customers/new">
          <Button size="sm" className="h-8 gap-1.5 text-xs">
            <UserPlus className="h-3.5 w-3.5" />
            Add Customer
          </Button>
        </Link>
      </div>

      <CustomerList customers={customers} />
    </div>
  )
}
