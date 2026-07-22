import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser, getEffectiveCap } from "@/lib/services/advertiser"
import { listSlotCalendar, getActiveBookingCount } from "@/lib/services/ad-slots"
import { getActivityHeatmap } from "@/lib/services/activity"
import { AdSlotsCalendar } from "@/components/business/AdSlotsCalendar"
import { ActivityHeatmap } from "@/components/business/ActivityHeatmap"

export default async function AdSlotsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const now = new Date()
  const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [bookings, activeCount, cap, heatmap] = await Promise.all([
    listSlotCalendar(now, to),
    getActiveBookingCount(advertiser.id),
    getEffectiveCap(advertiser.id, advertiser.plan),
    getActivityHeatmap(),
  ])

  return (
    <div className="space-y-0">
      <AdSlotsCalendar
        plan={advertiser.plan}
        walletBalanceUgx={advertiser.wallet_balance_ugx.toString()}
        activeCount={activeCount}
        cap={cap}
        viewerAdvertiserId={advertiser.id}
        initialFrom={now.toISOString()}
        initialBookings={bookings.map((b) => ({
          id: b.id,
          advertiserId: b.advertiser_id,
          startsAt: b.starts_at.toISOString(),
          endsAt: b.ends_at.toISOString(),
          durationType: b.duration_type,
          status: b.status,
          companyName: b.advertiser.company_name,
          verified: b.advertiser.verification_status === "VERIFIED",
          format: b.creative?.format ?? null,
        }))}
      />
      <div className="px-4 pb-8 md:px-8 max-w-4xl">
        <ActivityHeatmap cells={heatmap} />
      </div>
    </div>
  )
}
