import { NextResponse } from "next/server"
import { openFloatPayout } from "@/lib/services/payments/openfloat"
import { handleClientWithdrawalPayoutCallback } from "@/lib/services/client-wallet"

export async function POST(req: Request): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get("X-OpenFloat-Signature") ?? ""

  const payload = openFloatPayout.verifyCallback(rawBody, signature)
  if (!payload) {
    return new NextResponse("Invalid signature", { status: 400 })
  }

  try {
    await handleClientWithdrawalPayoutCallback(payload)
  } catch (err) {
    console.error("OpenFloat payout webhook processing error", err)
    return new NextResponse("Internal error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
