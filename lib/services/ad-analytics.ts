import { prisma } from "@/lib/db"

// Written by the ad-serving engine (Ad-tre) each time a published ad is shown.
// Region falls back to the viewer's profile country when the caller doesn't
// supply a finer one; age_group stays null until age data is collected
// somewhere. Best-effort — a failed impression write must never break serving.
export async function recordAdImpression(params: {
  bookingId: number
  viewerUserId?: number
  deviceId?: string
  ageGroup?: string
  region?: string
}): Promise<void> {
  try {
    let region = params.region
    if (!region && params.viewerUserId) {
      const profile = await prisma.profile.findUnique({
        where: { user_id: params.viewerUserId },
        select: { country_code: true },
      })
      region = profile?.country_code ?? undefined
    }

    await prisma.adImpression.create({
      data: {
        booking_id: params.bookingId,
        viewer_user_id: params.viewerUserId,
        device_id: params.deviceId,
        age_group: params.ageGroup,
        region,
      },
    })
  } catch (err) {
    console.error("recordAdImpression failed", { params, err })
  }
}

export interface AdAnalytics {
  totalViews: number
  uniqueViewers: number
  byDay: { day: string; views: number }[]
  byHour: { hour: number; views: number }[]
  byAgeGroup: { ageGroup: string; views: number }[]
  byRegion: { region: string; views: number }[]
}

// Per-ad breakdown for the Analytics section. Uses grouped counts rather than
// pulling every row so it stays cheap as impressions grow.
export async function getAdAnalytics(bookingId: number): Promise<AdAnalytics> {
  const [total, uniqueViewers, byAge, byRegion, rows] = await Promise.all([
    prisma.adImpression.count({ where: { booking_id: bookingId } }),
    prisma.adImpression
      .findMany({ where: { booking_id: bookingId, viewer_user_id: { not: null } }, distinct: ["viewer_user_id"], select: { viewer_user_id: true } })
      .then((r) => r.length),
    prisma.adImpression.groupBy({ by: ["age_group"], where: { booking_id: bookingId }, _count: { _all: true } }),
    prisma.adImpression.groupBy({ by: ["region"], where: { booking_id: bookingId }, _count: { _all: true } }),
    prisma.adImpression.findMany({ where: { booking_id: bookingId }, select: { viewed_at: true } }),
  ])

  const dayMap = new Map<string, number>()
  const hourMap = new Map<number, number>()
  for (const r of rows) {
    const day = r.viewed_at.toISOString().slice(0, 10)
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
    const hour = r.viewed_at.getUTCHours()
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1)
  }

  return {
    totalViews: total,
    uniqueViewers,
    byDay: [...dayMap.entries()].map(([day, views]) => ({ day, views })).sort((a, b) => a.day.localeCompare(b.day)),
    byHour: [...hourMap.entries()].map(([hour, views]) => ({ hour, views })).sort((a, b) => a.hour - b.hour),
    byAgeGroup: byAge
      .map((g) => ({ ageGroup: g.age_group ?? "Unknown", views: g._count._all }))
      .sort((a, b) => b.views - a.views),
    byRegion: byRegion
      .map((g) => ({ region: g.region ?? "Unknown", views: g._count._all }))
      .sort((a, b) => b.views - a.views),
  }
}

// Advertiser-wide roll-up: one row per booking that has ever been shown,
// newest first, for the Analytics landing list.
export async function listAdvertiserAdPerformance(advertiserId: number) {
  const bookings = await prisma.adSlotBooking.findMany({
    where: { advertiser_id: advertiserId },
    orderBy: { starts_at: "desc" },
    select: {
      id: true,
      starts_at: true,
      status: true,
      duration_type: true,
      creative: { select: { format: true, product_name: true } },
      _count: { select: { impressions: true } },
    },
  })
  return bookings.map((b) => ({
    bookingId: b.id,
    startsAt: b.starts_at,
    status: b.status,
    durationType: b.duration_type,
    format: b.creative?.format ?? null,
    productName: b.creative?.product_name ?? null,
    totalViews: b._count.impressions,
  }))
}
