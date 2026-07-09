import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { runHealthChecks } from "@/lib/services/system-health"
import { RefreshButton } from "./RefreshButton"

export const metadata = { title: "System Health — Admin" }
export const dynamic = "force-dynamic"

export default async function AdminSystemHealthPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const checks = await runHealthChecks()
  const allOk = checks.every((c) => c.status !== "down")

  return (
    <div className="px-4 py-5 md:p-8 max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">System health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live checks run each time this page loads — not a historical uptime log.
          </p>
        </div>
        <RefreshButton />
      </div>

      <div
        className={[
          "rounded-xl border p-4 text-sm font-medium",
          allOk
            ? "bg-success-bg text-success border-success/30"
            : "bg-error-bg text-error border-error/30",
        ].join(" ")}
      >
        {allOk ? "All systems operational" : "One or more checks are failing"}
      </div>

      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {checks.map((c) => (
          <div key={c.name} className="flex items-center justify-between gap-4 px-4 py-3 bg-background">
            <div className="flex items-center gap-3 min-w-0">
              <StatusDot status={c.status} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.name}</p>
                {c.message && (
                  <p className="text-xs text-muted-foreground truncate max-w-md">{c.message}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium capitalize">{c.status}</p>
              {c.latencyMs !== null && (
                <p className="text-[11px] text-muted-foreground font-mono">{c.latencyMs}ms</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: "ok" | "down" | "unconfigured" }) {
  const color =
    status === "ok" ? "bg-success" : status === "down" ? "bg-error" : "bg-muted-foreground"
  return <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
}
