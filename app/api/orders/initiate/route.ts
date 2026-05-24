import { NextResponse } from "next/server"
import { initiateOrder, ShopError } from "@/lib/services/shop"
import { pesapal } from "@/lib/services/payments/pesapal"
import { checkRateLimit } from "@/lib/rateLimit"
import { cookies } from "next/headers"

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  // Read affiliate attribution cookie
  const jar = await cookies()
  const refCookie = jar.get("subtree_ref")?.value ?? undefined

  const bodyWithRef = { ...(body as object), ref_cookie: refCookie }

  // Rate limit: 5 order attempts per phone per 10 min
  const phone = (body as { buyer_phone?: string })?.buyer_phone ?? ""
  const normalized = phone.replace(/\s+/g, "").replace(/^\+256/, "0").replace(/^256/, "0")
  const rl = checkRateLimit(`order:${normalized}`, { windowMs: 10 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    )
  }

  try {
    const result = await initiateOrder(bodyWithRef)

    // STK push via Pesapal (sandbox-safe — noop if keys not set)
    if (process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET) {
      try {
        await pesapal.requestToPay({
          amount: result.amount,
          phone: normalized,
          referenceId: result.idempotency_key,
          payerMessage: "Sub-tree shop purchase",
        })
      } catch (err) {
        console.error("Pesapal STK push failed for order", result.idempotency_key, err)
      }
    }

    // Clear attribution cookie on checkout initiation
    const res = NextResponse.json({ data: result }, { status: 202 })
    res.cookies.set("subtree_ref", "", { maxAge: 0, path: "/" })
    return res
  } catch (err) {
    if (err instanceof ShopError) {
      const status = err.code === "NOT_FOUND" ? 404
        : err.code === "OUT_OF_STOCK" ? 422
        : err.code === "VALIDATION_ERROR" ? 400 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
