import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import { AdminSettingsClient } from "./AdminSettingsClient"

export const metadata = { title: "Platform Settings — Admin" }

export default async function AdminSettingsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const [settings, auditLogs] = await Promise.all([
    prisma.platformSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.platformSettingAuditLog.findMany({
      orderBy: { changed_at: "desc" },
      take: 200,
    }),
  ])

  const serializedSettings = settings.map((s) => ({
    ...s,
    updated_at: s.updated_at.toISOString(),
    created_at: s.created_at.toISOString(),
  }))

  const serializedLogs = auditLogs.map((l) => ({
    ...l,
    changed_at: l.changed_at.toISOString(),
  }))

  return (
    <main className="min-h-screen bg-surface px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fee rates and platform-wide configuration. Changes take effect within 5 minutes.
          </p>
        </div>
        <AdminSettingsClient settings={serializedSettings} auditLogs={serializedLogs} />
      </div>
    </main>
  )
}
