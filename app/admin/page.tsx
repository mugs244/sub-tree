import { prisma } from "@/lib/db"
import { Users, Heart, TrendingUp, Activity } from "lucide-react"

export const metadata = { title: "Admin — Sub-tree" }

export default async function AdminPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalUsers, activeUsers, donationStats, recentUsers] = await Promise.all([
    prisma.user.count({ where: { deleted_at: null } }),
    prisma.user.count({
      where: { deleted_at: null, last_active_at: { gte: sevenDaysAgo } },
    }),
    prisma.donation.aggregate({
      where: { status: "COMPLETED" },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        id: true,
        username: true,
        email: true,
        created_at: true,
        profile: { select: { display_name: true, country_code: true } },
      },
    }),
  ])

  const totalDonations = donationStats._count.id
  const totalUGX = donationStats._sum.amount ?? 0

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users}      label="Total users"       value={totalUsers} />
        <StatCard icon={Activity}   label="Active (7d)"       value={activeUsers} />
        <StatCard icon={Heart}      label="Total donations"   value={totalDonations} />
        <StatCard
          icon={TrendingUp}
          label="Total processed"
          value={totalUGX > 0 ? `${(totalUGX / 1_000_000).toFixed(1)}M` : "0"}
          sublabel="UGX"
        />
      </div>

      {/* ── Recent sign-ups ───────────────────────────────── */}
      <div className="rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent sign-ups</h2>
          <a
            href="/admin/users"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </a>
        </div>
        <div className="divide-y divide-border">
          {recentUsers.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            recentUsers.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.profile?.display_name ?? u.username ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {u.profile?.country_code && (
                    <p className="text-xs text-muted-foreground">{u.profile.country_code}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    {u.created_at.toLocaleDateString("en-UG", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sublabel?: string
}) {
  return (
    <div className="flex items-start gap-3 bg-surface border border-border rounded-xl p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-xl font-semibold tracking-tight leading-none">{value}</p>
        {sublabel && (
          <p className="text-[10px] font-mono text-muted-foreground">{sublabel}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}
