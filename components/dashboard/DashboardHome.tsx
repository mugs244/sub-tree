import Link from "next/link"
import { Link2, Heart, Eye, Smartphone, CreditCard, Globe, ArrowUpRight, MousePointerClick } from "lucide-react"
import { DonationLaunchNotice } from "@/components/DonationLaunchNotice"
import { ProfileQRCode } from "@/components/ProfileQRCode"
import { CopyButton } from "@/components/CopyButton"
import { WalletCard } from "@/components/dashboard/WalletCard"

export interface DashboardHomeData {
  displayName: string
  username: string
  wallet: { available: number; totalReceived: number; inTransit: number; creatorFeeRate: number; processorFeeRate: number }
  withdrawals: { id: number; amount: number; net_amount: number; status: string; created_at: Date }[]
  stats: { links: number; donations: number; views: number }
  providers: { mtn: number; airtel: number; card: number }
  topReferrers: { source: string; count: number; amount: number }[]
  topLink: { label: string; url: string; clicks: number } | null
}

function greeting(): string {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Africa/Kampala" }))
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-success-bg text-success",
  FAILED: "bg-error-bg text-error",
  PENDING: "bg-warning-bg text-warning",
  PROCESSING: "bg-warning-bg text-warning",
}

// The creator dashboard's home screen. Pure view — app/(dashboard)/dashboard
// /page.tsx loads the data.
export function DashboardHome({ data }: { data: DashboardHomeData }) {
  const { displayName, username, wallet, withdrawals, stats, providers, topReferrers, topLink } = data
  const firstName = displayName.split(" ")[0] ?? displayName
  const pageUrl = `https://sub-tree.com/${username}`

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{firstName}</h1>
      </header>

      <DonationLaunchNotice inline />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Wallet + recent withdrawals */}
        <div className="space-y-5 lg:col-span-3">
          <WalletCard username={username} {...wallet} />

          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent withdrawals</h2>
              <Link href="/dashboard/activity?filter=withdrawals" className="text-xs font-medium text-[color:var(--dash-orange-text)] hover:underline">
                See all
              </Link>
            </div>
            {withdrawals.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No withdrawals yet</p>
            ) : (
              <ul className="divide-y divide-border">
                {withdrawals.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">Withdrawal</span>
                      <span className="block text-xs text-muted-foreground">
                        {w.created_at.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}UGX {w.net_amount.toLocaleString()} net
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-sm font-semibold">−{w.amount.toLocaleString()}</span>
                      <span className={["mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLE[w.status] ?? "bg-surface text-muted-foreground"].join(" ")}>
                        {w.status.charAt(0) + w.status.slice(1).toLowerCase()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Stats + share */}
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <StatTile icon={Eye} label="Profile views" value={stats.views} href={`/${username}`} external />
            <StatTile icon={Heart} label="Donations" value={stats.donations} href="/dashboard/activity?filter=donations" />
            <StatTile icon={Link2} label="Links" value={stats.links} href="/dashboard/links" />
          </div>

          <section className="rounded-3xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Share your page</h2>
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface py-2 pl-3.5 pr-2">
              <span className="min-w-0 flex-1 truncate font-mono text-sm">sub-tree.com/{username}</span>
              <CopyButton text={pageUrl} />
            </div>
            <div className="mt-4">
              <ProfileQRCode url={pageUrl} />
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Donation breakdown */}
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Where donations come from</h2>
          {stats.donations === 0 ? (
            <div className="py-8 text-center">
              <Heart className="mx-auto h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="mt-2 text-sm text-muted-foreground">No completed donations yet</p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">By provider</p>
                {providers.mtn > 0 && <BreakdownRow icon={Smartphone} label="MTN MoMo" count={providers.mtn} total={stats.donations} />}
                {providers.airtel > 0 && <BreakdownRow icon={Smartphone} label="Airtel Money" count={providers.airtel} total={stats.donations} />}
                {providers.card > 0 && <BreakdownRow icon={CreditCard} label="Card" count={providers.card} total={stats.donations} />}
              </div>
              {topReferrers.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">By source</p>
                  {topReferrers.map((r) => (
                    <BreakdownRow key={r.source} icon={Globe} label={r.source} count={r.count} total={stats.donations} amount={r.amount} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Top link */}
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Top link</h2>
          {topLink ? (
            <div className="mt-4 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--dash-orange-soft)]">
                <MousePointerClick className="h-6 w-6 text-[color:var(--dash-orange-text)]" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{topLink.label}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{topLink.url}</span>
              </span>
              <span className="text-right">
                <span className="block text-2xl font-bold tabular-nums">{topLink.clicks.toLocaleString()}</span>
                <span className="block text-xs text-muted-foreground">clicks</span>
              </span>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No link clicks yet</p>
              <Link href="/dashboard/links" className="mt-2 inline-block text-sm font-medium text-[color:var(--dash-orange-text)] hover:underline">
                Add links
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon, label, value, href, external,
}: {
  icon: React.ElementType
  label: string
  value: number
  href: string
  external?: boolean
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 transition-colors duration-150 hover:border-[color:var(--dash-orange)] lg:flex-row lg:items-center"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--dash-orange-soft)]">
        <Icon className="h-[18px] w-[18px] text-[color:var(--dash-orange-text)]" strokeWidth={2} />
      </span>
      <span className="min-w-0 lg:flex-1">
        <span className="block text-2xl font-bold leading-none tabular-nums">{value.toLocaleString()}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </Link>
  )
}

function BreakdownRow({
  icon: Icon, label, count, total, amount,
}: {
  icon: React.ElementType
  label: string
  count: number
  total: number
  amount?: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span className="font-medium capitalize">{label}</span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {amount !== undefined && <span className="font-mono">UGX {amount.toLocaleString()}</span>}
          <span>{count} · {pct}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-[color:var(--dash-orange)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
