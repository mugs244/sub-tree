import { NextResponse } from "next/server"
import { z } from "zod"
import { handleMomoCallback } from "@/lib/services/donation"
import { confirmOrderPayment } from "@/lib/services/shop"

const BYPASS_KEY = process.env.BYPASS_PAYMENTS_KEY

const schema = z.object({
  type: z.enum(["donation", "order"]),
  idempotency_key: z.string().uuid("Must be a valid UUID"),
})

export async function POST(req: Request): Promise<NextResponse> {
  // Route is disabled if BYPASS_PAYMENTS_KEY is not set
  if (!BYPASS_KEY) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }

  const key = req.headers.get("x-bypass-key")
  if (key !== BYPASS_KEY) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message },
      { status: 400 },
    )
  }

  const { type, idempotency_key } = parsed.data

  if (type === "donation") {
    await handleMomoCallback(
      {
        referenceId: idempotency_key,
        status: "SUCCESSFUL",
        providerTxId: `bypass_${idempotency_key.slice(0, 8)}`,
      },
      JSON.stringify({ bypass: true }),
    )
    return NextResponse.json({ data: { ok: true, type: "donation", idempotency_key } })
  }

  if (type === "order") {
    const result = await confirmOrderPayment(
      idempotency_key,
      `bypass_${idempotency_key.slice(0, 8)}`,
    )
    if (!result) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "No order found for that idempotency_key" },
        { status: 404 },
      )
    }
    return NextResponse.json({ data: { ok: true, type: "order", idempotency_key } })
  }

  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
}
