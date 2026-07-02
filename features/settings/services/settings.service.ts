import { CafeSettings } from "@prisma/client"
import { CafeSettingsFormValues } from "../schemas/settings.schema"
import prisma from "@/lib/prisma"

export async function getSettings(): Promise<CafeSettings> {
  let settings = await prisma.cafeSettings.findFirst()
  if (!settings) {
    settings = await prisma.cafeSettings.create({
      data: {
        cafeName: "Cue Junction Cafe",
        defaultHourlyRate: 200,
        receiptFooterText: "Thank you for visiting!",
        logoUrl: "",
        address: "123 Pool Street, Game Town",
        phone: "+91 98765 43210",
        email: "contact@cuejunction.com",
        currency: "INR",
        taxRate: 0,
        gstin: "",
        businessHours: "10:00 AM - 11:00 PM",
        acceptUpi: true,
        acceptCard: true,
        acceptCash: true
      }
    })
  }
  return settings
}

export async function updateSettings(data: CafeSettingsFormValues): Promise<CafeSettings> {
  const current = await getSettings()
  return await prisma.cafeSettings.update({
    where: { id: current.id },
    data: {
      cafeName: data.cafeName,
      defaultHourlyRate: data.defaultHourlyRate,
      receiptFooterText: data.receiptFooterText || "",
      logoUrl: data.logoUrl || "",
      address: data.address || "",
      phone: data.phone || "",
      email: data.email || "",
      currency: data.currency || "INR",
      taxRate: data.taxRate ?? 0,
      gstin: data.gstin || "",
      businessHours: data.businessHours || "",
      acceptUpi: data.acceptUpi,
      acceptCard: data.acceptCard,
      acceptCash: data.acceptCash
    }
  })
}
