import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight, BarChart3 } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listAdvertiserAdPerformance } from "@/lib/services/ad-analytics"

const FORMAT_LABEL: Record<string, string> = { BANNER: "Banner", VIDEO: "Video", SLIDE_UP_POPUP: "Slide-up" }

export default async function BusinessAnalyticsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const ads = await listAdvertiserAdPerformance(advertiser.id)
  const totalViews = ads.reduce((sum, a) => sum + a.totalViews, 0)

  return (
    <div className="px-4 py-5 md:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Audience breakdown per ad.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background border border-border">
          <BarChart3 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">Total views across all ads</p>
          <p className="text-3xl font-semibold tracking-tight">{totalViews.toLocaleString()}</p>
        </div>
      </div>

      {ads.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-border rounded-xl">
          No ads booked yet. Book an ad slot to start collecting analytics.
        </p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {ads.map((a) => (
            <Link
              key={a.bookingId}
              href={`/business/analytics/${a.bookingId}`}
              className="flex items-center justify-between px-4 py-3 bg-background hover:bg-surface transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.productName ?? (a.format ? FORMAT_LABEL[a.format] : "Ad")} · {a.startsAt.toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.totalViews.toLocaleString()} view{a.totalViews === 1 ? "" : "s"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
