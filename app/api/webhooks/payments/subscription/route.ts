import { NextResponse } from "next/server"
import { openFloat } from "@/lib/services/payments/openfloat"
import { getTransactionStatus } from "@/lib/services/payments/pesapal"
import { activateSubscription, failSubscription } from "@/lib/services/subscription"
import { prisma } from "@/lib/db"

// POST — OpenFloat HMAC-verified webhook for subscription payments
export async function POST(req: Request): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get("X-OpenFloat-Signature") ?? ""
  const payload = openFloat.verifyCallback(rawBody, signature)
  if (!payload) return new NextResponse("Invalid signature", { status: 400 })

  await handleSubscriptionCallback(payload.referenceId, payload.status === "SUCCESSFUL")
  return NextResponse.json({ received: true })
}

// GET — Pesapal IPN for subscription payments
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get("orderTrackingId")
  const merchantRef = searchParams.get("orderMerchantReference") ?? ""

  if (!orderTrackingId) return new NextResponse("Missing orderTrackingId", { status: 400 })

  const txStatus = await getTransactionStatus(orderTrackingId)
  if (!txStatus) return new NextResponse("Could not fetch transaction status", { status: 502 })

  // merchantRef is the idempotency_key we passed as the Pesapal order id
  const referenceId = txStatus.referenceId || merchantRef
  await handleSubscriptionCallback(referenceId, txStatus.status === "SUCCESSFUL")
  return NextResponse.json({ received: true })
}

async function handleSubscriptionCallback(
  idempotencyKey: string,
  success: boolean,
): Promise<void> {
  // Check if this is a subscription payment (not a donation)
  const sub = await prisma.subscription.findUnique({
    where: { idempotency_key: idempotencyKey },
  })
  if (!sub) return // not a subscription payment — ignore silently

  if (success) {
    await activateSubscription(idempotencyKey)
  } else {
    await failSubscription(idempotencyKey)
  }
}
