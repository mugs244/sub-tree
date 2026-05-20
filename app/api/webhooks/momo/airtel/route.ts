import { NextResponse } from "next/server"
import { airtelMoney } from "@/lib/services/momo/airtel"
import { handleMomoCallback } from "@/lib/services/donation"

export async function POST(req: Request): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get("X-Airtel-Signature") ?? ""

  const payload = airtelMoney.verifyCallback(rawBody, signature)
  if (!payload) {
    return new NextResponse("Invalid signature", { status: 400 })
  }

  try {
    await handleMomoCallback(payload, rawBody)
  } catch (err) {
    console.error("Airtel Money webhook processing error", err)
    return new NextResponse("Internal error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
