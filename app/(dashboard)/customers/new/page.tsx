import { CustomerForm } from "@/features/customers/components/CustomerForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewCustomerPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            New Customer
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add a new customer to the system.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <CustomerForm />
      </div>
    </div>
  )
}
