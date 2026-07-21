import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { getBookingForAdvertiser } from "@/lib/services/ad-slots"
import { getAdAnalytics } from "@/lib/services/ad-analytics"

function BreakdownBar({ label, views, total }: { label: string; views: number; total: number }) {
  const pct = total > 0 ? Math.round((views / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium capitalize">{label}</span>
        <span className="text-muted-foreground">{views.toLocaleString()} · {pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-background overflow-hidden">
        <div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Section({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-3">
      <h2 className="text-sm font-medium">{title}</h2>
      {empty ? <p className="text-xs text-muted-foreground py-2">No data yet</p> : <div className="space-y-3">{children}</div>}
    </div>
  )
}

export default async function AdAnalyticsDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const { bookingId } = await params
  const bookingIdNum = Number(bookingId)
  if (!Number.isInteger(bookingIdNum)) notFound()

  const booking = await getBookingForAdvertiser(advertiser.id, bookingIdNum)
  if (!booking) notFound()

  const a = await getAdAnalytics(bookingIdNum)

  return (
    <div className="px-4 py-5 md:p-8 max-w-3xl space-y-6">
      <div>
        <Link href="/business/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Back to analytics
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          {booking.creative?.product_name ?? "Ad"} analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {booking.starts_at.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-2xl font-semibold tracking-tight">{a.totalViews.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total views</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-2xl font-semibold tracking-tight">{a.uniqueViewers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Unique viewers</p>
        </div>
      </div>

      {a.totalViews === 0 && (
        <p className="text-xs text-muted-foreground bg-surface border border-border rounded-lg p-3">
          No views recorded yet. Analytics fill in once your ad is served to viewers.
        </p>
      )}

      <Section title="Views by day" empty={a.byDay.length === 0}>
        {a.byDay.map((d) => (
          <BreakdownBar key={d.day} label={new Date(d.day + "T00:00:00").toLocaleDateString("en-UG", { day: "numeric", month: "short" })} views={d.views} total={a.totalViews} />
        ))}
      </Section>

      <Section title="Views by time of day" empty={a.byHour.length === 0}>
        {a.byHour.map((h) => (
          <BreakdownBar key={h.hour} label={`${String(h.hour).padStart(2, "0")}:00`} views={h.views} total={a.totalViews} />
        ))}
      </Section>

      <Section title="Age group" empty={a.byAgeGroup.length === 0}>
        {a.byAgeGroup.map((g) => (
          <BreakdownBar key={g.ageGroup} label={g.ageGroup} views={g.views} total={a.totalViews} />
        ))}
      </Section>

      <Section title="Region" empty={a.byRegion.length === 0}>
        {a.byRegion.map((r) => (
          <BreakdownBar key={r.region} label={r.region} views={r.views} total={a.totalViews} />
        ))}
      </Section>
    </div>
  )
}
