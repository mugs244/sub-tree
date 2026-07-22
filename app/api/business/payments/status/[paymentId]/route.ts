import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { getAdvertiserPaymentStatus } from "@/lib/services/advertiser-payment"

// Polled by the payment-complete page after the advertiser returns from
// Pesapal, to reflect whether the IPN has settled the payment yet.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ paymentId: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const { paymentId } = await params
  const paymentIdNum = Number(paymentId)
  if (!Number.isInteger(paymentIdNum)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid payment id" }, { status: 400 })
  }

  const payment = await getAdvertiserPaymentStatus(advertiser.id, paymentIdNum)
  if (!payment) return NextResponse.json({ error: "NOT_FOUND", message: "Payment not found" }, { status: 404 })

  return NextResponse.json({ data: payment })
}
