import { prisma } from "@/lib/db"
import { getSettingAsNumber } from "@/lib/services/platform-settings"

// Ad-tre — intelligent routing engine (in-house v1). Decides which ad, if any,
// to show a device right now, so viewers are never flooded. See
// docs/v3/features/ad-tre-routing.md for the full design. Kept behind the
// AdRouter interface so a Revive-backed implementation can replace it later.

export interface AdRequestContext {
  deviceId: string
  viewerUserId?: number
  now?: Date
  /** Bookings to skip — e.g. ads already placed elsewhere in the same feed page. */
  excludeBookingIds?: number[]
}

export interface SelectedAd {
  bookingId: number
  format: string
  mediaUrl: string | null
  logoUrl: string | null
  appUrl: string | null
  websiteUrl: string | null
  productName: string | null
  productDesc: string | null
}

export type AdDecision =
  | { ad: SelectedAd }
  | { ad: null; reason: "no_inventory" | "frequency_capped" | "paced" }

export interface AdRouter {
  selectAdForDevice(ctx: AdRequestContext): Promise<AdDecision>
}

interface RouterConfig {
  freqCap: number
  freqWindowMin: number
  minSpacingSec: number
  bookingCooldownMin: number
}

async function loadConfig(): Promise<RouterConfig> {
  const [freqCap, freqWindowMin, minSpacingSec, bookingCooldownMin] = await Promise.all([
    getSettingAsNumber("ad_route_freq_cap", 5),
    getSettingAsNumber("ad_route_freq_window_min", 60),
    getSettingAsNumber("ad_route_min_spacing_sec", 120),
    getSettingAsNumber("ad_route_booking_cooldown_min", 30),
  ])
  return { freqCap, freqWindowMin, minSpacingSec, bookingCooldownMin }
}

class InHouseAdRouter implements AdRouter {
  async selectAdForDevice(ctx: AdRequestContext): Promise<AdDecision> {
    const now = ctx.now ?? new Date()
    const cfg = await loadConfig()

    // 1. Live inventory — published bookings currently inside their window,
    //    that actually have a creative to render, minus any explicitly excluded
    //    (already placed elsewhere in this same feed page).
    const exclude = ctx.excludeBookingIds ?? []
    const liveBookings = await prisma.adSlotBooking.findMany({
      where: {
        status: "PUBLISHED",
        starts_at: { lte: now },
        ends_at: { gte: now },
        creative: { isNot: null },
        ...(exclude.length > 0 ? { id: { notIn: exclude } } : {}),
      },
      select: {
        id: true,
        creative: {
          select: {
            format: true,
            media_url: true,
            logo_url: true,
            app_url: true,
            website_url: true,
            product_name: true,
            product_desc: true,
          },
        },
      },
    })
    if (liveBookings.length === 0) return { ad: null, reason: "no_inventory" }

    // This device's recent impressions across ALL ads, newest first — the
    // basis for the frequency cap, pacing, and per-booking rotation. One read
    // covers all three checks.
    const windowStart = new Date(now.getTime() - cfg.freqWindowMin * 60_000)
    const recent = await prisma.adImpression.findMany({
      where: { device_id: ctx.deviceId, viewed_at: { gte: windowStart } },
      orderBy: { viewed_at: "desc" },
      select: { booking_id: true, viewed_at: true },
    })

    // 2. Global per-device frequency cap — the core anti-flood rule.
    if (recent.length >= cfg.freqCap) return { ad: null, reason: "frequency_capped" }

    // 3. Pacing — minimum spacing since the last ad this device saw.
    const lastSeen = recent[0]?.viewed_at
    if (lastSeen && now.getTime() - lastSeen.getTime() < cfg.minSpacingSec * 1000) {
      return { ad: null, reason: "paced" }
    }

    // Most-recent view time per booking for this device (from the window read).
    const lastByBooking = new Map<number, number>()
    for (const imp of recent) {
      if (!lastByBooking.has(imp.booking_id)) lastByBooking.set(imp.booking_id, imp.viewed_at.getTime())
    }

    // 4. Per-booking cooldown — drop candidates seen too recently, so the same
    //    ad doesn't repeat back-to-back while other inventory exists.
    const cooldownCutoff = now.getTime() - cfg.bookingCooldownMin * 60_000
    let candidates = liveBookings.filter((b) => {
      const seenAt = lastByBooking.get(b.id)
      return seenAt === undefined || seenAt < cooldownCutoff
    })
    // If everything is on cooldown, fall back to all live inventory rather than
    // showing nothing — the frequency cap already bounds total exposure.
    if (candidates.length === 0) candidates = liveBookings

    // 5. Fair rotation — least-recently-seen first (never-seen sorts first).
    candidates.sort((a, b) => (lastByBooking.get(a.id) ?? 0) - (lastByBooking.get(b.id) ?? 0))
    const chosen = candidates[0]!

    return {
      ad: {
        bookingId: chosen.id,
        format: chosen.creative!.format,
        mediaUrl: chosen.creative!.media_url,
        logoUrl: chosen.creative!.logo_url,
        appUrl: chosen.creative!.app_url,
        websiteUrl: chosen.creative!.website_url,
        productName: chosen.creative!.product_name,
        productDesc: chosen.creative!.product_desc,
      },
    }
  }
}

export const inHouseAdRouter: AdRouter = new InHouseAdRouter()
