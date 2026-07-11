import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"
import { checkRateLimit } from "@/lib/rateLimit"
import { submitOrder as submitPesapalOrder } from "@/lib/services/payments/pesapal"
import { openFloat } from "@/lib/services/payments/openfloat"
import { mtnMomo } from "@/lib/services/momo/mtn"
import { airtelMoney } from "@/lib/services/momo/airtel"
import type { MomoProvider } from "@/lib/services/momo/types"

const initiateSchema = z
  .object({
    username: z.string().min(1),
    amount: z.number().int().min(500, "Minimum donation is UGX 500"),
    payment_method: z.enum(["mobile_money", "card"]).default("mobile_money"),
    phone: z.string().min(9, "Invalid phone number").optional(),
    donor_name: z.string().max(100).optional(),
    note: z.string().max(120).optional(),
    referrer_source: z.string().max(50).optional(),
    fundraiser_id: z.number().int().positive().optional(),
  })
  .refine((data) => data.payment_method !== "mobile_money" || !!data.phone, {
    message: "Phone number is required for mobile money",
    path: ["phone"],
  })

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = initiateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  const { username, amount, payment_method, phone, donor_name, note, referrer_source, fundraiser_id } = parsed.data

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, deleted_at: true },
  })
  if (!user || user.deleted_at) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Creator not found" }, { status: 404 })
  }

  // Card payers never enter a phone number — only Pesapal's hosted checkout
  // supports card, so there's no network to detect and no STK fallback.
  let provider: "MTN_MOMO" | "AIRTEL_MONEY" | "CARD"
  let normalized: string | null = null

  if (payment_method === "card") {
    provider = "CARD"
  } else {
    normalized = phone!.replace(/\s+/g, "").replace(/^\+256/, "0").replace(/^256/, "0")
    const mtnPrefixes = ["077", "078", "039", "031"]
    const airtelPrefixes = ["070", "075", "074"]
    const prefix = normalized.slice(0, 3)
    const detected = mtnPrefixes.includes(prefix)
      ? "MTN_MOMO"
      : airtelPrefixes.includes(prefix)
        ? "AIRTEL_MONEY"
        : null

    if (!detected) {
      return NextResponse.json(
        { error: "UNSUPPORTED_NETWORK", message: "Phone number must be on MTN or Airtel Uganda" },
        { status: 422 },
      )
    }
    provider = detected
  }

  // 3 donation attempts per phone (or IP, for card) per 10 minutes
  const rateLimitKey = normalized ?? req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  const rl = checkRateLimit(`donate:${rateLimitKey}`, { windowMs: 10 * 60 * 1000, max: 3 })
  if (!rl.allowed) {
    const retryAfterSecs = Math.ceil(rl.retryAfterMs / 1000)
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } },
    )
  }

  const idempotencyKey = randomUUID()

  try {
    await prisma.donation.create({
      data: {
        user_id: user.id,
        donor_phone: normalized,
        donor_name: donor_name ?? null,
        amount,
        currency: "UGX",
        status: "PENDING",
        provider,
        idempotency_key: idempotencyKey,
        note: note ?? null,
        referrer_source: referrer_source ?? null,
        fundraiser_id: fundraiser_id ?? null,
      },
    })
  } catch (err) {
    console.error("Failed to create donation", { idempotencyKey, userId: user.id, error: err })
    return NextResponse.json(
      { error: "DONATION_FAILED", message: "Failed to initiate donation. Please try again." },
      { status: 500 },
    )
  }

  const stkParams = {
    amount,
    phone: normalized ?? undefined,
    referenceId: idempotencyKey,
    payerMessage: "Sub-tree donation",
  }

  // Pesapal is a hosted-checkout redirect flow, not a silent STK push — the
  // donor must actually be sent to redirect_url (embedded in an iframe on
  // the donate page), so it can't go through the generic requestToPay chain
  // below, which just fires-and-forgets. Tried first (for both card and
  // mobile money — Pesapal handles both); mobile money falls through to the
  // STK-push chain if Pesapal isn't configured or the request fails. Card
  // has no fallback since none of the other providers accept card at all.
  const pesapalConfigured = !!(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET)
  if (pesapalConfigured) {
    try {
      const callbackUrl = `https://sub-tree.vercel.app/donate/complete?ref=${idempotencyKey}`
      const result = await submitPesapalOrder(stkParams, callbackUrl)
      if (result.redirectUrl) {
        return NextResponse.json(
          { data: { idempotency_key: idempotencyKey, redirect_url: result.redirectUrl } },
          { status: 202 },
        )
      }
    } catch (err) {
      console.error("Pesapal SubmitOrderRequest failed", err)
    }
  }

  if (payment_method === "card") {
    return NextResponse.json(
      { error: "CARD_UNAVAILABLE", message: "Card payments aren't available right now — please use mobile money." },
      { status: 502 },
    )
  }

  // Aggregator STK push: OpenFloat → direct MTN/Airtel
  const directProvider: MomoProvider = provider === "MTN_MOMO" ? mtnMomo : airtelMoney
  const chain: Array<{ name: string; client: MomoProvider; configured: boolean }> = [
    {
      name: "OpenFloat",
      client: openFloat,
      configured: !!process.env.OPENFLOAT_API_KEY,
    },
    {
      name: provider === "MTN_MOMO" ? "MTN direct" : "Airtel direct",
      client: directProvider,
      configured:
        provider === "MTN_MOMO"
          ? !!(process.env.MTN_MOMO_API_USER && process.env.MTN_MOMO_API_KEY)
          : !!(process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET),
    },
  ]

  let lastError: unknown
  for (const { name, client, configured } of chain) {
    if (!configured) continue
    try {
      await client.requestToPay({ ...stkParams, phone: stkParams.phone! })
      lastError = undefined
      break
    } catch (err) {
      console.error(`${name} STK push failed, trying next`, err)
      lastError = err
    }
  }

  if (lastError) {
    // All configured providers failed — donation record stays PENDING for manual review
    console.error("All payment providers failed for", idempotencyKey, lastError)
  }

  return NextResponse.json({ data: { idempotency_key: idempotencyKey } }, { status: 202 })
}
