import { getInvoice } from "@/features/billing/services/billing.service"
import { getSettings } from "@/features/settings/services/settings.service"
import { InvoiceDetailView } from "@/features/billing/components/InvoiceDetailView"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [invoice, settings] = await Promise.all([
    getInvoice(id),
    getSettings()
  ])

  if (!invoice) {
    notFound()
  }

  return <InvoiceDetailView invoice={invoice} settings={settings} />
}
