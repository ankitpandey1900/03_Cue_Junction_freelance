import { CustomerForm } from "@/features/customers/components/CustomerForm"
import { getCustomerById } from "@/features/customers/services/customer.service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const customer = await getCustomerById(resolvedParams.id)

  if (!customer) {
    notFound()
  }

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
            Edit Customer
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {customer.name}
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <CustomerForm initialData={customer} />
      </div>
    </div>
  )
}
