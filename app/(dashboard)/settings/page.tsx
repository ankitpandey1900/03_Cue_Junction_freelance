import { getSettings } from "@/features/settings/services/settings.service"
import { SettingsForm } from "@/features/settings/components/SettingsForm"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Global configuration for your cafe
        </p>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  )
}
