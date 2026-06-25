import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { Link2, Heart, Eye, TrendingUp, Smartphone, Globe, UserPlus } from "lucide-react"
import { NotificationsFeed } from "@/components/NotificationsFeed"

export default async function DashboardHomePage() {
  const session = await getSession()
  const userId = session!.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      profile: { select: { display_name: true, view_count: true } },
      _count: { select: { links: true } },
    },
  })

  const displayName = user?.profile?.display_name ?? user?.username ?? "Creator"
  const username = user?.username ?? ""

  const [donationStats, topLink, providerBreakdown, referrerBreakdown, tierCount] =
    await Promise.all([
      prisma.donation.aggregate({
        where: { user_id: userId, status: "COMPLETED" },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.link.findFirst({
        where: { user_id: userId, is_enabled: true, clicks: { gt: 0 } },
        orderBy: { clicks: "desc" },
        select: { label: true, clicks: true, url: true },
      }),
      prisma.donation.groupBy({
        by: ["provider"],
        where: { user_id: userId, status: "COMPLETED" },
        _count: { id: true },
      }),
      prisma.donation.groupBy({
        by: ["referrer_source"],
        where: {
          user_id: userId,
          status: "COMPLETED",
          referrer_source: { not: null },
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.membershipTier.count({
        where: { creator_id: userId },
      }),
    ])

  const totalDonations = donationStats._count.id
  const totalUGX = donationStats._sum.amount ?? 0

  const mtnCount = providerBreakdown.find((p) => p.provider === "MTN_MOMO")?._count.id ?? 0
  const airtelCount = providerBreakdown.find((p) => p.provider === "AIRTEL_MONEY")?._count.id ?? 0

  const topReferrers = referrerBreakdown
    .filter((r) => r.referrer_source)
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 5)

  return (
    <div className="px-4 py-5 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          sub-tree.com/<span className="font-mono">{username}</span>
        </p>
      </div>

      {/* ── Core stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Link2}
          label="Links"
          value={user?._count.links ?? 0}
          href="/dashboard/links"
        />
        <StatCard
          icon={Heart}
          label="Donations"
          value={totalDonations}
          href="/dashboard/donations"
        />
        <StatCard
          icon={UserPlus}
          label="Membership tiers"
          value={tierCount}
          href="/dashboard/subscriptions"
        />
        <StatCard
          icon={Eye}
          label="Profile views"
          value={user?.profile?.view_count ?? 0}
          href={`/${username}`}
          external
        />
        <StatCard
          icon={TrendingUp}
          label="Total received"
          value={totalUGX > 0 ? `${(totalUGX / 1000).toFixed(0)}K` : "—"}
          sublabel="UGX"
          href="/dashboard/donations"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-medium">Membership tiers</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Build your subscription offering and let fans join the right tier on your public profile.
              </p>
            </div>
            <a
              href="/dashboard/subscriptions"
              className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
            >
              Manage tiers
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {tierCount > 0
              ? `You currently have ${tierCount} membership tier${tierCount === 1 ? "" : "s"}.`
              : "You haven't created any membership tiers yet."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Donation breakdown ──────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium">Donation breakdown</h2>

          {totalDonations === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No completed donations yet
            </p>
          ) : (
            <div className="space-y-4">
              {/* Provider split */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">By provider</p>
                <div className="space-y-2">
                  {mtnCount > 0 && (
                    <BreakdownRow
                      icon={Smartphone}
                      label="MTN MoMo"
                      count={mtnCount}
                      total={totalDonations}
                    />
                  )}
                  {airtelCount > 0 && (
                    <BreakdownRow
                      icon={Smartphone}
                      label="Airtel Money"
                      count={airtelCount}
                      total={totalDonations}
                    />
                  )}
                </div>
              </div>

              {/* Referrer split */}
              {topReferrers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">By source</p>
                  <div className="space-y-2">
                    {topReferrers.map((r) => (
                      <BreakdownRow
                        key={r.referrer_source}
                        icon={Globe}
                        label={String(r.referrer_source)}
                        count={r._count.id}
                        total={totalDonations}
                        amount={r._sum.amount ?? 0}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Top link ───────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium">Top link</h2>
          {topLink ? (
            <div className="space-y-1">
              <p className="font-medium text-sm truncate">{topLink.label}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{topLink.url}</p>
              <p className="text-2xl font-semibold tracking-tight pt-2">{topLink.clicks}</p>
              <p className="text-xs text-muted-foreground">clicks</p>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">No link clicks yet</p>
              <a
                href="/dashboard/links"
                className="text-xs underline underline-offset-4 text-muted-foreground mt-1 inline-block"
              >
                Add links →
              </a>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <h3 className="text-xs text-muted-foreground mb-2">Your public page</h3>
            <a
              href={`/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline underline-offset-4"
            >
              sub-tree.com/{username}
            </a>
          </div>
        </div>
      </div>

      {/* ── Notification feed ──────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Donation notifications</h2>
        <p className="text-xs text-muted-foreground -mt-1">Updates every 30 seconds</p>
        <NotificationsFeed />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  href,
  external,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sublabel?: string
  href: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-start gap-3 bg-surface border border-border rounded-xl p-4 hover:border-foreground/20 transition-colors duration-150"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-xl font-semibold tracking-tight leading-none">{value}</p>
        {sublabel && <p className="text-[10px] font-mono text-muted-foreground">{sublabel}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </a>
  )
}

function BreakdownRow({
  icon: Icon,
  label,
  count,
  total,
  amount,
}: {
  icon: React.ElementType
  label: string
  count: number
  total: number
  amount?: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="capitalize font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {amount !== undefined && (
            <span className="font-mono">UGX {amount.toLocaleString()}</span>
          )}
          <span>{count} · {pct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-background overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
