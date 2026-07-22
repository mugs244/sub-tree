import { NextResponse } from "next/server"
import { getTransactionStatus } from "@/lib/services/payments/pesapal"
import { handleAdvertiserPaymentCallback } from "@/lib/services/advertiser-payment"

// Pesapal IPN for advertiser payments (subscription + wallet top-up). Same
// shape as the donation IPN, but settles an AdvertiserPayment. Register this
// URL with its own IPN id in the Pesapal dashboard and pass that id when
// submitting advertiser orders, so advertiser payments and donations don't
// cross wires.
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get("orderTrackingId")

  if (!orderTrackingId) {
    return new NextResponse("Missing orderTrackingId", { status: 400 })
  }

  const payload = await getTransactionStatus(orderTrackingId)
  if (!payload) {
    return new NextResponse("Could not fetch transaction status", { status: 502 })
  }

  try {
    await handleAdvertiserPaymentCallback(payload)
  } catch (err) {
    console.error("Advertiser Pesapal IPN processing error", err)
    return new NextResponse("Internal error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
