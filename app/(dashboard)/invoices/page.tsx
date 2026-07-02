import { getInvoices } from "@/features/billing/services/billing.service"
import { InvoiceList } from "@/features/billing/components/InvoiceList"

export const dynamic = "force-dynamic"

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Billing &amp; Invoices
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review finalized bills from ended sessions
        </p>
      </div>

      <InvoiceList invoices={invoices as any} />
    </div>
  )
}
