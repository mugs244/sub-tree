import { Prisma, AdSlotDurationType, AdFormat } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getSettingAsNumber } from "@/lib/services/platform-settings"
import { PLAN_CAP_MULTIPLIER } from "@/lib/services/advertiser"

type Db = typeof prisma | Prisma.TransactionClient

export class AdSlotError extends Error {
  constructor(
    public readonly code:
      | "INVALID_RANGE"
      | "SLOT_TAKEN"
      | "CAP_REACHED"
      | "INSUFFICIENT_BALANCE"
      | "NOT_FOUND"
      | "CANCEL_NOT_ALLOWED",
    message: string,
  ) {
    super(message)
    this.name = "AdSlotError"
  }
}

// Bookings in these states hold their slot and count against the plan cap —
// CANCELLED/REFUNDED free it up, COMPLETED has already aired and no longer
// conflicts with new bookings for that same window.
const ACTIVE_STATUSES = ["DRAFT", "READY", "PUBLISHED"] as const

const DURATION_PRICE_DEFAULTS: Record<AdSlotDurationType, number> = {
  HOUR: 20_000,
  DAY: 120_000,
  WEEK: 700_000,
  BIWEEKLY: 1_300_000,
  MONTH: 2_400_000,
}

async function priceForDuration(durationType: AdSlotDurationType): Promise<number> {
  const key = `ad_slot_price_${durationType.toLowerCase()}`
  return getSettingAsNumber(key, DURATION_PRICE_DEFAULTS[durationType])
}

async function priceForRerunDay(): Promise<number> {
  return getSettingAsNumber("ad_slot_rerun_price_day", 40_000)
}

// Calendar read for the Ad Slots timetable — every advertiser sees the same
// shared inventory (what's taken, by whom, in what format) so booking a
// window is informed by what's actually available, not just their own bookings.
export async function listSlotCalendar(from: Date, to: Date) {
  return prisma.adSlotBooking.findMany({
    where: {
      status: { in: [...ACTIVE_STATUSES, "COMPLETED"] },
      starts_at: { lt: to },
      ends_at: { gt: from },
    },
    select: {
      id: true,
      advertiser_id: true,
      starts_at: true,
      ends_at: true,
      duration_type: true,
      status: true,
      advertiser: { select: { company_name: true, verification_status: true } },
      creative: { select: { format: true, published_at: true } },
    },
    orderBy: { starts_at: "asc" },
  })
}

export async function getActiveBookingCount(advertiserId: number, db: Db = prisma): Promise<number> {
  return db.adSlotBooking.count({
    where: { advertiser_id: advertiserId, status: { in: [...ACTIVE_STATUSES] } },
  })
}

export async function getBookingForAdvertiser(advertiserId: number, bookingId: number) {
  const booking = await prisma.adSlotBooking.findUnique({
    where: { id: bookingId },
    include: { creative: true },
  })
  if (!booking || booking.advertiser_id !== advertiserId) return null
  return booking
}

export async function listAdvertiserBookings(advertiserId: number) {
  return prisma.adSlotBooking.findMany({
    where: { advertiser_id: advertiserId },
    orderBy: { starts_at: "desc" },
    include: { creative: true, reruns: true },
  })
}

// Buy now, upload later: this only reserves the window and deducts the
// wallet — no AdCreative is required or created here. The advisory lock is
// scoped to the advertiser (not the slot window) since the cap check and the
// balance check both need a consistent view of "this advertiser's other
// in-flight bookings", not just this one time range.
export async function bookAdSlot(params: {
  advertiserId: number
  userId: number
  startsAt: Date
  endsAt: Date
  durationType: AdSlotDurationType
}): Promise<{ bookingId: number; priceUgx: number }> {
  const { advertiserId, userId, startsAt, endsAt, durationType } = params

  if (endsAt <= startsAt) {
    throw new AdSlotError("INVALID_RANGE", "End time must be after start time")
  }

  const price = Math.round(await priceForDuration(durationType))

  const booking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advertiserId})`

    const advertiser = await tx.advertiser.findUniqueOrThrow({ where: { id: advertiserId } })

    const baseCap = await getSettingAsNumber("ad_slot_base_cap", 1)
    const cap = Math.round(baseCap * PLAN_CAP_MULTIPLIER[advertiser.plan])
    const activeCount = await getActiveBookingCount(advertiserId, tx)
    if (activeCount >= cap) {
      throw new AdSlotError(
        "CAP_REACHED",
        `Your ${advertiser.plan.toLowerCase()} plan allows ${cap} concurrent ad slots — free one up, or buy additional caps in Credits`,
      )
    }

    const overlap = await tx.adSlotBooking.findFirst({
      where: {
        status: { in: [...ACTIVE_STATUSES] },
        starts_at: { lt: endsAt },
        ends_at: { gt: startsAt },
      },
    })
    if (overlap) {
      throw new AdSlotError("SLOT_TAKEN", "That time is no longer available — pick another slot")
    }

    if (advertiser.wallet_balance_ugx < BigInt(price)) {
      throw new AdSlotError(
        "INSUFFICIENT_BALANCE",
        `Only UGX ${advertiser.wallet_balance_ugx.toLocaleString()} available in your wallet — top up to book this slot`,
      )
    }

    const balanceAfter = advertiser.wallet_balance_ugx - BigInt(price)

    const created = await tx.adSlotBooking.create({
      data: {
        advertiser_id: advertiserId,
        booked_by: userId,
        starts_at: startsAt,
        ends_at: endsAt,
        duration_type: durationType,
        price_ugx: price,
        status: "DRAFT",
      },
    })

    await tx.advertiser.update({
      where: { id: advertiserId },
      data: { wallet_balance_ugx: balanceAfter },
    })

    await tx.advertiserWalletTransaction.create({
      data: {
        advertiser_id: advertiserId,
        type: "SLOT_PURCHASE",
        amount_ugx: -price,
        balance_after_ugx: balanceAfter,
        related_booking_id: created.id,
        note: `Ad slot booked — ${durationType.toLowerCase()}, ${startsAt.toISOString()} to ${endsAt.toISOString()}`,
      },
    })

    return created
  })

  return { bookingId: booking.id, priceUgx: price }
}

// One rerun row per ticked calendar day — priced and executed independently,
// so a single day can later be rescheduled or refunded without touching the
// rest of the rerun set.
export async function bookAdSlotReruns(params: {
  advertiserId: number
  bookingId: number
  rerunDates: Date[]
}): Promise<{ totalUgx: number; rerunIds: number[] }> {
  const { advertiserId, bookingId, rerunDates } = params
  if (rerunDates.length === 0) {
    throw new AdSlotError("INVALID_RANGE", "Pick at least one day to rerun")
  }

  const pricePerDay = Math.round(await priceForRerunDay())
  const totalUgx = pricePerDay * rerunDates.length

  const rerunIds = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advertiserId})`

    const booking = await tx.adSlotBooking.findUnique({
      where: { id: bookingId },
      select: { advertiser_id: true },
    })
    if (!booking || booking.advertiser_id !== advertiserId) {
      throw new AdSlotError("NOT_FOUND", "Booking not found")
    }

    const advertiser = await tx.advertiser.findUniqueOrThrow({ where: { id: advertiserId } })
    if (advertiser.wallet_balance_ugx < BigInt(totalUgx)) {
      throw new AdSlotError(
        "INSUFFICIENT_BALANCE",
        `Only UGX ${advertiser.wallet_balance_ugx.toLocaleString()} available — top up to book these reruns`,
      )
    }

    const balanceAfter = advertiser.wallet_balance_ugx - BigInt(totalUgx)

    const created = await Promise.all(
      rerunDates.map((rerun_date) =>
        tx.adRerun.create({
          data: { booking_id: bookingId, rerun_date, price_ugx: pricePerDay, status: "DRAFT" },
        }),
      ),
    )

    await tx.advertiser.update({ where: { id: advertiserId }, data: { wallet_balance_ugx: balanceAfter } })

    await tx.advertiserWalletTransaction.create({
      data: {
        advertiser_id: advertiserId,
        type: "RERUN_PURCHASE",
        amount_ugx: -totalUgx,
        balance_after_ugx: balanceAfter,
        related_booking_id: bookingId,
        note: `${rerunDates.length} rerun day(s) booked`,
      },
    })

    return created.map((r) => r.id)
  })

  return { totalUgx, rerunIds }
}

export async function estimateRerunCost(rerunDates: Date[]): Promise<number> {
  const pricePerDay = Math.round(await priceForRerunDay())
  return pricePerDay * rerunDates.length
}

export interface AdCreativeInput {
  format: AdFormat
  mediaUrl?: string
  logoUrl?: string
  appUrl?: string
  websiteUrl?: string
  productName?: string
  productDesc?: string
}

// Upsert rather than create — the editor is opened repeatedly while a
// business iterates on the creative before publishing (or comes back later
// for a booking made without content, per the spec's "buy now, upload later"
// flow), so re-saving the same booking's creative should just update it.
export async function saveAdCreative(
  advertiserId: number,
  bookingId: number,
  input: AdCreativeInput,
): Promise<{ creativeId: number }> {
  const booking = await prisma.adSlotBooking.findUnique({
    where: { id: bookingId },
    select: { advertiser_id: true, status: true },
  })
  if (!booking || booking.advertiser_id !== advertiserId) {
    throw new AdSlotError("NOT_FOUND", "Booking not found")
  }

  const creative = await prisma.adCreative.upsert({
    where: { booking_id: bookingId },
    update: {
      format: input.format,
      media_url: input.mediaUrl,
      logo_url: input.logoUrl,
      app_url: input.appUrl,
      website_url: input.websiteUrl,
      product_name: input.productName,
      product_desc: input.productDesc,
    },
    create: {
      booking_id: bookingId,
      format: input.format,
      media_url: input.mediaUrl,
      logo_url: input.logoUrl,
      app_url: input.appUrl,
      website_url: input.websiteUrl,
      product_name: input.productName,
      product_desc: input.productDesc,
    },
  })

  if (booking.status === "DRAFT") {
    await prisma.adSlotBooking.update({ where: { id: bookingId }, data: { status: "READY" } })
  }

  return { creativeId: creative.id }
}

// Publish requires a creative to already exist (READY) — a booking with no
// content uploaded yet has nothing to go live with.
export async function publishAdSlot(advertiserId: number, bookingId: number): Promise<void> {
  const booking = await prisma.adSlotBooking.findUnique({
    where: { id: bookingId },
    select: { advertiser_id: true, status: true, creative: { select: { id: true } } },
  })
  if (!booking || booking.advertiser_id !== advertiserId) {
    throw new AdSlotError("NOT_FOUND", "Booking not found")
  }
  if (!booking.creative) {
    throw new AdSlotError("NOT_FOUND", "Upload ad content before publishing")
  }

  await prisma.$transaction([
    prisma.adSlotBooking.update({ where: { id: bookingId }, data: { status: "PUBLISHED" } }),
    prisma.adCreative.update({ where: { booking_id: bookingId }, data: { published_at: new Date() } }),
  ])
}

// Shared refund core for both user-initiated cancellation and system
// auto-refund. Runs inside a caller-provided transaction that already holds
// the advertiser's advisory lock, so the wallet read-modify-write is
// consistent with any concurrent booking. Refunds the slot price plus every
// not-yet-aired (DRAFT) rerun tied to it, and moves those reruns out of the
// active set too. `finalStatus` distinguishes who initiated it: CANCELLED
// (the advertiser) vs REFUNDED (the platform's auto-refund).
async function refundBookingInTx(
  tx: Prisma.TransactionClient,
  bookingId: number,
  advertiserId: number,
  finalStatus: "CANCELLED" | "REFUNDED",
  note: string,
): Promise<number> {
  const reruns = await tx.adRerun.findMany({
    where: { booking_id: bookingId, status: "DRAFT" },
    select: { id: true, price_ugx: true },
  })
  const booking = await tx.adSlotBooking.findUniqueOrThrow({
    where: { id: bookingId },
    select: { price_ugx: true },
  })

  const refundTotal = booking.price_ugx + reruns.reduce((sum, r) => sum + r.price_ugx, 0)

  const advertiser = await tx.advertiser.findUniqueOrThrow({ where: { id: advertiserId } })
  const balanceAfter = advertiser.wallet_balance_ugx + BigInt(refundTotal)

  await tx.adSlotBooking.update({ where: { id: bookingId }, data: { status: finalStatus } })
  if (reruns.length > 0) {
    await tx.adRerun.updateMany({
      where: { id: { in: reruns.map((r) => r.id) } },
      data: { status: finalStatus },
    })
  }

  await tx.advertiser.update({ where: { id: advertiserId }, data: { wallet_balance_ugx: balanceAfter } })
  await tx.advertiserWalletTransaction.create({
    data: {
      advertiser_id: advertiserId,
      type: "REFUND",
      amount_ugx: refundTotal,
      balance_after_ugx: balanceAfter,
      related_booking_id: bookingId,
      note,
    },
  })

  return refundTotal
}

// Advertiser cancels their own booking and gets the wallet credited back.
// Only DRAFT/READY (pre-publish) bookings can be self-cancelled — once an ad
// is PUBLISHED it's aired value, and refunding it needs a proration policy
// that isn't specified yet, so those are steered to support instead.
export async function cancelAdSlot(advertiserId: number, bookingId: number): Promise<{ refundedUgx: number }> {
  const refunded = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advertiserId})`

    const booking = await tx.adSlotBooking.findUnique({
      where: { id: bookingId },
      select: { advertiser_id: true, status: true },
    })
    if (!booking || booking.advertiser_id !== advertiserId) {
      throw new AdSlotError("NOT_FOUND", "Booking not found")
    }
    if (booking.status !== "DRAFT" && booking.status !== "READY") {
      throw new AdSlotError(
        "CANCEL_NOT_ALLOWED",
        booking.status === "PUBLISHED"
          ? "This ad is already live — contact support to stop it"
          : "This booking can no longer be cancelled",
      )
    }

    return refundBookingInTx(tx, bookingId, advertiserId, "CANCELLED", "Booking cancelled — slot and reruns refunded")
  })

  return { refundedUgx: refunded }
}

// Auto-refund of stale unfilled slots: a booking sits in DRAFT (paid, but no
// content ever uploaded) and its window has now passed by more than the
// configured threshold. Meant to be driven by a cron; returns how many it
// refunded. Locks per-advertiser so it never races an in-flight booking.
export async function autoRefundStaleDrafts(now: Date = new Date()): Promise<{ refundedCount: number }> {
  const thresholdHours = await getSettingAsNumber("ad_slot_auto_refund_hours", 24)
  const cutoff = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000)

  const stale = await prisma.adSlotBooking.findMany({
    where: { status: "DRAFT", ends_at: { lt: cutoff } },
    select: { id: true, advertiser_id: true },
  })

  let refundedCount = 0
  for (const b of stale) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${b.advertiser_id})`
      // Re-check under the lock — a concurrent cancel/publish may have moved it.
      const fresh = await tx.adSlotBooking.findUnique({ where: { id: b.id }, select: { status: true } })
      if (fresh?.status !== "DRAFT") return
      await refundBookingInTx(tx, b.id, b.advertiser_id, "REFUNDED", "Auto-refunded — slot expired with no content uploaded")
      refundedCount++
    })
  }

  return { refundedCount }
}
