import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import AdminGeoMap from '../../../components/AdminGeoMap'

export default async function AdminAnalyticsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const users = await prisma.user.findMany({
    select: {
      id: true,
      last_active_at: true,
      profile: { select: { country_code: true } },
    },
  })

  const countryCounts = users.reduce<Record<string, number>>((acc, user) => {
    const country = user.profile?.country_code ?? "Unknown"
    acc[country] = (acc[country] ?? 0) + 1
    return acc
  }, {})

  const countries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, count }))

  const activeUsers = users.filter((u) => u.last_active_at).length
  const totalUsers = users.length

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics & Geography</h1>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            {totalUsers} users · {activeUsers} with recent activity
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[color:var(--border-default)] p-4">
            <h2 className="text-sm font-semibold mb-3">User geography</h2>
            <AdminGeoMap countries={countries} totalUsers={totalUsers} />
          </div>
          <div className="rounded-xl border border-[color:var(--border-default)] p-4">
            <h2 className="text-sm font-semibold mb-3">Top countries</h2>
            <ul className="space-y-2 text-sm text-[color:var(--text-secondary)]">
              {countries.slice(0, 10).map((country) => (
                <li key={country.code} className="flex justify-between gap-4">
                  <span>{country.code}</span>
                  <span>{country.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
