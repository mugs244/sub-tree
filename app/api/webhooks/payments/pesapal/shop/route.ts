import { NextResponse } from "next/server"
import { getTransactionStatus } from "@/lib/services/payments/pesapal"
import { confirmOrderPayment } from "@/lib/services/shop"

// Pesapal IPN for shop orders:
//   ?orderTrackingId={id}&orderNotificationType=IPNCHANGE&orderMerchantReference={our_idempotency_key}
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get("orderTrackingId")
  const merchantRef = searchParams.get("orderMerchantReference")

  if (!orderTrackingId || !merchantRef) {
    return new NextResponse("Missing required params", { status: 400 })
  }

  const payload = await getTransactionStatus(orderTrackingId)
  if (!payload) {
    return new NextResponse("Could not fetch transaction status", { status: 502 })
  }

  if (payload.status !== "SUCCESSFUL") {
    // Payment failed — leave order unconfirmed (will be abandoned)
    return NextResponse.json({ received: true, status: payload.status })
  }

  try {
    await confirmOrderPayment(merchantRef, orderTrackingId)
  } catch (err) {
    console.error("Shop order payment confirmation error", err)
    return new NextResponse("Internal error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
