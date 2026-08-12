import { getSettings } from "@/features/settings/services/settings.service"
import { SettingsForm } from "@/features/settings/components/SettingsForm"
import { getStaffMembers } from "@/features/settings/services/staff.service"
import { requireAdminPage } from "@/lib/action-auth"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  await requireAdminPage()

  const [settings, staffMembers] = await Promise.all([
    getSettings(),
    getStaffMembers(),
  ])

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

      <SettingsForm initialData={settings} staffMembers={staffMembers} />

      <div className="mt-12 text-center pb-8">
        <p className="text-sm text-muted-foreground/60">
          Developed by Ankit Pandey<br/>
          &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </div>
  )
}
