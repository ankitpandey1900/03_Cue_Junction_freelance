import { getLogs } from "@/features/logs/services/log.service"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function LogsPage() {
  const logs = await getLogs()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          A secure feed of all system actions
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Timestamp</TableHead>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Action</TableHead>
              <TableHead className="text-xs">Entity</TableHead>
              <TableHead className="text-xs">Entity ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12"
                >
                  <ScrollText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No activity logs found.</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {log.user.name || log.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-mono font-medium">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.entityType}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs truncate max-w-[120px]">
                    {log.entityId}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
