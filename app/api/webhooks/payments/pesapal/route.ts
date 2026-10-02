import { NextResponse } from "next/server"
import { getTransactionStatus } from "@/lib/services/payments/pesapal"
import { handleMomoCallback } from "@/lib/services/donation"
import { handleInvoicePesapalPayment } from "@/lib/services/billing"

// Pesapal IPN sends a GET request to this URL with query params:
//   ?orderTrackingId={id}&orderNotificationType=IPNCHANGE&orderMerchantReference={our_ref}
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get("orderTrackingId")
  const merchantRef = searchParams.get("orderMerchantReference")
  // IPNCHANGE for normal payments, RECURRING for Pesapal card auto-renewals.
  const notificationType = searchParams.get("orderNotificationType")

  if (!orderTrackingId) {
    return new NextResponse("Missing orderTrackingId", { status: 400 })
  }

  const payload = await getTransactionStatus(orderTrackingId)
  if (!payload) {
    return new NextResponse("Could not fetch transaction status", { status: 502 })
  }

  try {
    await handleMomoCallback(payload, JSON.stringify({ orderTrackingId, merchantRef }))
    // Sub-pay invoices share this IPN; it ignores references that aren't its own.
    await handleInvoicePesapalPayment(payload, notificationType)
  } catch (err) {
    console.error("Pesapal IPN processing error", err)
    return new NextResponse("Internal error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
