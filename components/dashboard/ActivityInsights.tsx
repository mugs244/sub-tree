import Link from "next/link"
import { Eye, MousePointerClick, Heart, Smartphone, CreditCard, Globe } from "lucide-react"
import { PlatformIcon } from "@/components/PlatformIcon"
import { detectPlatform } from "@/lib/utils/platform"

export interface InsightsData {
  username: string
  views: number
  taps: number
  donations: number
  topLinks: { id: number; label: string; url: string; clicks: number }[]
  providers: { mtn: number; airtel: number; card: number }
  topReferrers: { source: string; count: number; amount: number }[]
}

// Activity → Insights: how the page is doing. Moved here from the home screen
// so home stays focused on money, like a banking app.
export function ActivityInsights({ data }: { data: InsightsData }) {
  const { username, views, taps, donations, topLinks, providers, topReferrers } = data
  const maxClicks = Math.max(1, ...topLinks.map((l) => l.clicks))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Eye} label="Profile views" value={views} href={`/${username}`} external />
        <Stat icon={MousePointerClick} label="Link taps" value={taps} href="/dashboard/links" />
        <Stat icon={Heart} label="Donations" value={donations} href="/dashboard/activity?filter=donations" />
      </div>

      <section className="rounded-3xl bg-surface p-5">
        <h2 className="font-semibold">Top links</h2>
        {topLinks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No link taps yet</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {topLinks.map((l) => (
              <li key={l.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <PlatformIcon platform={detectPlatform(l.url)} className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{l.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{l.clicks.toLocaleString()} taps</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card">
                  <div className="h-full rounded-full bg-[#ff8a3d]" style={{ width: `${Math.round((l.clicks / maxClicks) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-surface p-5">
        <h2 className="font-semibold">Where donations come from</h2>
        {donations === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No completed donations yet</p>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">By provider</p>
              {providers.mtn > 0 && <Bar icon={Smartphone} label="MTN MoMo" count={providers.mtn} total={donations} />}
              {providers.airtel > 0 && <Bar icon={Smartphone} label="Airtel Money" count={providers.airtel} total={donations} />}
              {providers.card > 0 && <Bar icon={CreditCard} label="Card" count={providers.card} total={donations} />}
            </div>
            {topReferrers.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">By source</p>
                {topReferrers.map((r) => (
                  <Bar key={r.source} icon={Globe} label={r.source} count={r.count} total={donations} amount={r.amount} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ icon: Icon, label, value, href, external }: { icon: React.ElementType; label: string; value: number; href: string; external?: boolean }) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex flex-col gap-3 rounded-3xl bg-surface p-4 transition-colors duration-150 hover:bg-[color:var(--dash-orange-soft)]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-white dark:bg-white/10">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <span>
        <span className="block text-2xl font-bold leading-none tabular-nums">{value.toLocaleString()}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </Link>
  )
}

function Bar({ icon: Icon, label, count, total, amount }: { icon: React.ElementType; label: string; count: number; total: number; amount?: number }) {
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
      <div className="h-2 overflow-hidden rounded-full bg-card">
        <div className="h-full rounded-full bg-[#ff8a3d]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
