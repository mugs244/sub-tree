import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser, PLAN_CAP_MULTIPLIER } from "@/lib/services/advertiser"
import { listSlotCalendar, getActiveBookingCount } from "@/lib/services/ad-slots"
import { getSettingAsNumber } from "@/lib/services/platform-settings"
import { AdSlotsCalendar } from "@/components/business/AdSlotsCalendar"

export default async function AdSlotsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const now = new Date()
  const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [bookings, activeCount, baseCap] = await Promise.all([
    listSlotCalendar(now, to),
    getActiveBookingCount(advertiser.id),
    getSettingAsNumber("ad_slot_base_cap", 1),
  ])
  const cap = Math.round(baseCap * PLAN_CAP_MULTIPLIER[advertiser.plan])

  return (
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
  )
}
