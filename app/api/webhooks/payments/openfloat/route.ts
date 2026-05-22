import { NextResponse } from "next/server"
import { openFloat } from "@/lib/services/payments/openfloat"
import { handleMomoCallback } from "@/lib/services/donation"

export async function POST(req: Request): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get("X-OpenFloat-Signature") ?? ""

  const payload = openFloat.verifyCallback(rawBody, signature)
  if (!payload) {
    return new NextResponse("Invalid signature", { status: 400 })
  }

  try {
    await handleMomoCallback(payload, rawBody)
  } catch (err) {
    console.error("OpenFloat webhook processing error", err)
    return new NextResponse("Internal error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
