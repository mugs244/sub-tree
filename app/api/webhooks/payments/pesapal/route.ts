import { NextResponse } from "next/server"
import { getTransactionStatus } from "@/lib/services/payments/pesapal"
import { handleMomoCallback } from "@/lib/services/donation"
import { handleAdvertiserPaymentCallback } from "@/lib/services/advertiser-payment"

// Pesapal IPN sends a GET request to this URL with query params:
//   ?orderTrackingId={id}&orderNotificationType=IPNCHANGE&orderMerchantReference={our_ref}
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get("orderTrackingId")
  const merchantRef = searchParams.get("orderMerchantReference")

  if (!orderTrackingId) {
    return new NextResponse("Missing orderTrackingId", { status: 400 })
  }

  const payload = await getTransactionStatus(orderTrackingId)
  if (!payload) {
    return new NextResponse("Could not fetch transaction status", { status: 502 })
  }

  try {
    // Advertiser payments share this IPN unless a dedicated one is registered.
    // Both handlers are idempotent and reference-scoped, so each no-ops when
    // the reference isn't theirs — safe to dispatch to both.
    await handleMomoCallback(payload, JSON.stringify({ orderTrackingId, merchantRef }))
    await handleAdvertiserPaymentCallback(payload)
  } catch (err) {
    console.error("Pesapal IPN processing error", err)
    return new NextResponse("Internal error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
