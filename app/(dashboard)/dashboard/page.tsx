import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { Link2, Heart, Eye, Smartphone, Globe, Wallet, CreditCard } from "lucide-react"
import { NotificationsFeed } from "@/components/NotificationsFeed"
import { DonationLaunchNotice } from "@/components/DonationLaunchNotice"
import { getClientBalance, listClientWithdrawals } from "@/lib/services/client-wallet"
import { getFeeRate } from "@/lib/services/platform-settings"
import { WithdrawButton } from "./WithdrawButton"
import { ProfileQRCode } from "@/components/ProfileQRCode"

export default async function DashboardHomePage() {
  const session = await getSession()
  const userId = session!.userId

  // Runs alongside the rest of the batch below instead of blocking it —
  // this query doesn't depend on any of those results, so there's no reason
  // to pay for it as a separate round trip before the batch starts.
  const [user, donationStats, topLink, providerBreakdown, referrerBreakdown, balance, withdrawals, creatorFeeRate, processorFeeRate] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          profile: { select: { display_name: true, view_count: true } },
          _count: { select: { links: true } },
        },
      }),
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
      getClientBalance(userId),
      listClientWithdrawals(userId, 5),
      getFeeRate("fee_withdrawal_creator", 0.02),
      getFeeRate("fee_withdrawal_processor", 0.01),
    ])

  const displayName = user?.profile?.display_name ?? user?.username ?? "Creator"
  const username = user?.username ?? ""

  const totalDonations = donationStats._count.id
  const totalUGX = donationStats._sum.amount ?? 0

  const mtnCount = providerBreakdown.find((p) => p.provider === "MTN_MOMO")?._count.id ?? 0
  const airtelCount = providerBreakdown.find((p) => p.provider === "AIRTEL_MONEY")?._count.id ?? 0
  const cardCount = providerBreakdown.find((p) => p.provider === "CARD")?._count.id ?? 0

  const topReferrers = referrerBreakdown
    .filter((r) => r.referrer_source)
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 5)

  return (
    <div className="px-4 py-5 md:p-8 max-w-4xl space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          sub-tree.com/<span className="font-mono">{username}</span>
        </p>
      </div>

      <DonationLaunchNotice />

      {/* ── Balance ────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background border border-border">
            <Wallet className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Available to withdraw</p>
            <p className="text-3xl font-semibold tracking-tight">
              UGX {Math.round(balance.available).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              UGX {totalUGX.toLocaleString()} total received
            </p>
          </div>
        </div>
        <WithdrawButton available={balance.available} creatorFeeRate={creatorFeeRate} processorFeeRate={processorFeeRate} />
      </div>

      {withdrawals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Recent withdrawals</h2>
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 bg-background text-sm">
                <div>
                  <span className="font-mono">UGX {w.amount.toLocaleString()}</span>
                  <p className="text-[11px] text-muted-foreground">
                    UGX {w.net_amount.toLocaleString()} net after fees
                  </p>
                </div>
                <span
                  className={[
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    w.status === "COMPLETED" ? "bg-success-bg text-success"
                      : w.status === "FAILED" ? "bg-error-bg text-error"
                      : "bg-warning-bg text-warning",
                  ].join(" ")}
                >
                  {w.status.charAt(0) + w.status.slice(1).toLowerCase()}
                </span>
                <span className="text-muted-foreground text-xs">
                  {w.created_at.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Core stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
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
          icon={Eye}
          label="Profile views"
          value={user?.profile?.view_count ?? 0}
          href={`/${username}`}
          external
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* ── Donation breakdown ──────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          <h2 className="text-sm font-medium">Donation breakdown</h2>

          {totalDonations === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
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
                  {cardCount > 0 && (
                    <BreakdownRow
                      icon={CreditCard}
                      label="Card"
                      count={cardCount}
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
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          <h2 className="text-sm font-medium">Top link</h2>
          {topLink ? (
            <div className="space-y-1">
              <p className="font-medium text-sm truncate">{topLink.label}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{topLink.url}</p>
              <p className="text-2xl font-semibold tracking-tight pt-2">{topLink.clicks}</p>
              <p className="text-xs text-muted-foreground">clicks</p>
            </div>
          ) : (
            <div className="py-3 text-center">
              <p className="text-sm text-muted-foreground">No link clicks yet</p>
              <a
                href="/dashboard/links"
                className="text-xs underline underline-offset-4 text-muted-foreground mt-1 inline-block"
              >
                Add links →
              </a>
            </div>
          )}

          <div className="border-t border-border pt-3 sm:pt-4 space-y-3">
            <div>
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
            {username && <ProfileQRCode url={`https://sub-tree.com/${username}`} />}
          </div>
        </div>
      </div>

      {/* ── Notification feed ──────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Notifications</h2>
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
