import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import AdminGeoMap from "@/components/AdminGeoMap"

export const metadata = { title: "Analytics — Admin" }

export default async function AdminAnalyticsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const users = await prisma.user.findMany({
    select: {
      last_active_at: true,
      profile: { select: { country_code: true } },
    },
  })

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
      </div>
    </div>
  )
}
