import { prisma } from "@/lib/db"
import { getSettingAsNumber } from "@/lib/services/platform-settings"
import { inHouseAdRouter, type SelectedAd } from "@/lib/services/ad-router"

// The short-form feed — the surface Ad-tre serves into. It pages through live
// content items newest-first and, at a fixed cadence, asks the router for an
// ad to slot between them. If the router declines (frequency-capped, paced, or
// no inventory), that ad break is simply skipped and the viewer sees content —
// the engine never forces an ad in, which is the whole "never flood" point.
//
// Selection vs. recording: the feed only PROPOSES ads here. The client reports
// an impression (recordAdImpression) when an ad actually scrolls into view, so
// a page that is assembled but never fully watched doesn't burn a viewer's cap.
// Cadence (feed_ad_interval) bounds ad density within a page; the router's
// per-device cap/pacing bound exposure across pages once impressions land.

export interface FeedContentEntry {
  kind: "content"
  id: number
  caption: string | null
  mediaUrl: string
  mediaType: string
  durationSec: number | null
  creator: { username: string | null }
}

export interface FeedAdEntry {
  kind: "ad"
  bookingId: number
  ad: SelectedAd
}

export type FeedEntry = FeedContentEntry | FeedAdEntry

export interface FeedPage {
  entries: FeedEntry[]
  nextCursor: number | null
}

export async function getFeedPage(params: {
  deviceId: string
  viewerUserId?: number
  cursor?: number // content item id to page after (exclusive); omit for the first page
  limit?: number
}): Promise<FeedPage> {
  const { deviceId, viewerUserId } = params
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 30)
  const adInterval = Math.max(1, Math.round(await getSettingAsNumber("feed_ad_interval", 4)))

  // Newest-first, id-cursored. id descends with created_at (autoincrement), so
  // "older than cursor" is `id < cursor` — stable pagination without offsets.
  const items = await prisma.contentItem.findMany({
    where: { deleted_at: null, ...(params.cursor ? { id: { lt: params.cursor } } : {}) },
    orderBy: { id: "desc" },
    take: limit,
    select: {
      id: true,
      caption: true,
      media_url: true,
      media_type: true,
      duration_sec: true,
      creator: { select: { username: true } },
    },
  })

  const entries: FeedEntry[] = []
  const placedBookingIds: number[] = []
  let sinceAd = 0

  for (const item of items) {
    entries.push({
      kind: "content",
      id: item.id,
      caption: item.caption,
      mediaUrl: item.media_url,
      mediaType: item.media_type,
      durationSec: item.duration_sec,
      creator: { username: item.creator.username },
    })

    sinceAd++
    if (sinceAd >= adInterval) {
      sinceAd = 0
      const decision = await inHouseAdRouter.selectAdForDevice({
        deviceId,
        viewerUserId,
        excludeBookingIds: placedBookingIds, // no repeat ad within one page
      })
      if (decision.ad) {
        entries.push({ kind: "ad", bookingId: decision.ad.bookingId, ad: decision.ad })
        placedBookingIds.push(decision.ad.bookingId)
      }
      // No ad available → skip this break; the viewer just gets more content.
    }
  }

  const nextCursor = items.length === limit ? (items[items.length - 1]?.id ?? null) : null
  return { entries, nextCursor }
}
