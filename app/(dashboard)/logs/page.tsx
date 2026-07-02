import { getLogs } from "@/features/logs/services/log.service"
import { ShieldAlert } from "lucide-react"
import { requireAdminPage } from "@/lib/action-auth"
import { AuditLogTable } from "@/features/logs/components/AuditLogTable"

export const dynamic = "force-dynamic"

export default async function LogsPage() {
  await requireAdminPage()

  const logs = await getLogs()

  // Convert raw logs to feed the client AuditLogTable component
  const logsPlain = logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt,
    user: {
      name: log.user.name,
      email: log.user.email,
    },
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          A secure feed of all system actions
        </p>
      </div>

      <AuditLogTable initialLogs={logsPlain} />
    </div>
  )
}
