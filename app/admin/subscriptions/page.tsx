import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

export const metadata = { title: "Subscriptions — Admin" }

const STATUS_COLORS: Record<string, string> = {
  TRIALING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAST_DUE: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-neutral-100 text-neutral-600",
}

export default async function AdminSubscriptionsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const subs = await prisma.subscription.findMany({
    orderBy: { created_at: "desc" },
    include: {
      user: {
        select: { email: true, username: true, phone: true },
      },
    },
  })

  const counts = {
    TRIALING: subs.filter((s) => s.status === "TRIALING").length,
    ACTIVE: subs.filter((s) => s.status === "ACTIVE").length,
    PAST_DUE: subs.filter((s) => s.status === "PAST_DUE").length,
    CANCELLED: subs.filter((s) => s.status === "CANCELLED").length,
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            {subs.length} total
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).map(([status, count]) => (
            <span
              key={status}
              className={[
                "text-[12px] font-medium px-2.5 py-1 rounded-full",
                STATUS_COLORS[status] ?? "bg-neutral-100 text-neutral-600",
              ].join(" ")}
            >
              {status.replace("_", " ")} · {count}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[color:var(--border-default)]">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[color:var(--border-default)] bg-[color:var(--bg-raised)]">
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">User</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Tier</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Period end</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Trial ends</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Created</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-[color:var(--border-default)] last:border-0 hover:bg-[color:var(--bg-raised)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{sub.user.email}</p>
                    {sub.user.username && (
                      <p className="text-[11px] text-[color:var(--text-muted)]">@{sub.user.username}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{sub.tier.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "text-[11px] font-medium px-2 py-0.5 rounded-full",
                        STATUS_COLORS[sub.status] ?? "",
                      ].join(" ")}
                    >
                      {sub.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--text-secondary)]">
                    {sub.current_period_end.toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--text-secondary)]">
                    {sub.trial_ends_at ? sub.trial_ends_at.toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--text-secondary)]">
                    {sub.created_at.toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[color:var(--text-muted)]">
                    No subscriptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
