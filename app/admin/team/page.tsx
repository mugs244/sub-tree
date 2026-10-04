import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { getAllAdminIds, isSuperAdmin } from "@/lib/services/admin"
import { subShopAdminSyncConfigured } from "@/lib/services/subshop-admin"
import { TeamAccessToggle } from "./TeamAccessToggle"

export const metadata = { title: "Team — Admin" }

// Super admins only: who on the admin team may switch to the Sub-shop admin
// portal. Admins themselves are set by ADMIN_USER_IDS; super admins by
// SUPER_ADMIN_USER_IDS.
export default async function AdminTeamPage() {
  const session = await getSession()
  if (!session || !isSuperAdmin(session.userId)) redirect("/admin")

  const ids = getAllAdminIds()
  const [users, perms] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, username: true, profile: { select: { display_name: true } } },
    }),
    prisma.adminPermission.findMany({ where: { user_id: { in: ids } }, select: { user_id: true, can_access_subshop: true } }),
  ])
  const access = new Map(perms.map((p) => [p.user_id, p.can_access_subshop]))
  const sync = subShopAdminSyncConfigured()

  return (
    <div className="max-w-3xl space-y-6 px-4 py-5 md:p-8">
      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which admins can switch to the Sub-shop admin portal. Super admins always can.
        </p>
      </div>

      {!sync && (
        <p className="rounded-xl bg-warning-bg px-4 py-3 text-sm text-warning">
          Sub-shop sync isn&apos;t set up, so turning access on won&apos;t create their Sub-shop admin login automatically.
          Add <code className="font-mono">SUBSHOP_API_URL</code> and <code className="font-mono">SUBSHOP_ADMIN_API_KEY</code> in Vercel.
        </p>
      )}

      <div className="divide-y divide-border rounded-xl border border-border">
        {users.map((u) => {
          const superAdmin = isSuperAdmin(u.id)
          return (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {u.profile?.display_name ?? u.username ?? u.email}
                  <span className={["rounded-full px-2 py-0.5 text-[10px] font-semibold", superAdmin ? "bg-foreground text-background" : "bg-surface text-muted-foreground"].join(" ")}>
                    {superAdmin ? "Super admin" : "Admin"}
                  </span>
                  {u.id === session.userId && <span className="text-[11px] text-muted-foreground">(you)</span>}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">{u.email}</p>
              </div>
              {superAdmin ? (
                <span className="text-xs text-muted-foreground">Always has Sub-shop access</span>
              ) : (
                <TeamAccessToggle userId={u.id} initial={access.get(u.id) ?? false} />
              )}
            </div>
          )
        })}
        {users.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No admins found.</p>}
      </div>
    </div>
  )
}
