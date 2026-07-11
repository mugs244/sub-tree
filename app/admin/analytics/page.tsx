import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import AdminGeoMap from "@/components/AdminGeoMap"

export const metadata = { title: "Analytics — Admin" }

export default async function AdminAnalyticsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const [users, viewAgg, clickAgg, donationAgg, topCreatorsByViews, topLinksByClicks] = await Promise.all([
    prisma.user.findMany({
      select: {
        last_active_at: true,
        profile: { select: { country_code: true } },
      },
    }),
    prisma.profile.aggregate({ _sum: { view_count: true } }),
    prisma.link.aggregate({ _sum: { clicks: true } }),
    prisma.donation.aggregate({
      where: { status: "COMPLETED" },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.profile.findMany({
      where: { view_count: { gt: 0 } },
      orderBy: { view_count: "desc" },
      take: 10,
      select: { display_name: true, view_count: true, user: { select: { username: true } } },
    }),
    prisma.link.findMany({
      where: { clicks: { gt: 0 }, is_enabled: true },
      orderBy: { clicks: "desc" },
      take: 10,
      select: { label: true, clicks: true, user: { select: { username: true } } },
    }),
  ])

  const countryCounts = users.reduce<Record<string, number>>((acc, u) => {
    const code = u.profile?.country_code ?? "Unknown"
    acc[code] = (acc[code] ?? 0) + 1
    return acc
  }, {})

  const countries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([code, count]) => ({ code, count }))

  const activeUsers = users.filter((u) => u.last_active_at).length
  const totalUsers = users.length

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalUsers} total users · {activeUsers} with recorded activity
        </p>
      </div>

      {/* ── Platform traffic totals ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Profile views" value={viewAgg._sum.view_count ?? 0} />
        <StatCard label="Link clicks" value={clickAgg._sum.clicks ?? 0} />
        <StatCard label="Completed donations" value={donationAgg._count.id} />
        <StatCard label="Donation volume" value={donationAgg._sum.amount ?? 0} prefix="UGX " />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium mb-4">User geography</h2>
          <AdminGeoMap countries={countries} totalUsers={totalUsers} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium mb-4">Top countries</h2>
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {countries.slice(0, 10).map(({ code, count }) => (
                <li key={code} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{code}</span>
                  <span className="font-mono font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium mb-4">Top creators by profile views</h2>
          {topCreatorsByViews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {topCreatorsByViews.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">
                    {p.display_name} <span className="font-mono">@{p.user.username}</span>
                  </span>
                  <span className="font-mono font-medium shrink-0 ml-2">{p.view_count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium mb-4">Top links by clicks</h2>
          {topLinksByClicks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {topLinksByClicks.map((l, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">
                    {l.label} <span className="font-mono">@{l.user.username}</span>
                  </span>
                  <span className="font-mono font-medium shrink-0 ml-2">{l.clicks.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, prefix }: { label: string; value: number; prefix?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight mt-1">
        {prefix}
        {value.toLocaleString()}
      </p>
    </div>
  )
}
