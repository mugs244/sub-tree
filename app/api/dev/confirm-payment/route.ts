import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { handleMomoCallback } from "@/lib/services/donation"
import { confirmOrderPayment } from "@/lib/services/shop"

const BYPASS_KEY = process.env.BYPASS_PAYMENTS_KEY

const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("donation"),
    idempotency_key: z.uuid(),
  }),
  z.object({
    type: z.literal("order"),
    idempotency_key: z.uuid(),
  }),
  // TODO: remove before launch — dev-only tier override
  z.object({
    type: z.literal("tier"),
    tier: z.enum(["FREE", "PRO", "BUSINESS", "CONTENT_HOUSE"]),
  }),
])

export async function POST(req: Request): Promise<NextResponse> {
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

  if (parsed.data.type === "donation") {
    await handleMomoCallback(
      {
        referenceId: parsed.data.idempotency_key,
        status: "SUCCESSFUL",
        providerTxId: `bypass_${parsed.data.idempotency_key.slice(0, 8)}`,
      },
      JSON.stringify({ bypass: true }),
    )
    return NextResponse.json({ data: { ok: true, type: "donation" } })
  }

  if (parsed.data.type === "order") {
    const result = await confirmOrderPayment(
      parsed.data.idempotency_key,
      `bypass_${parsed.data.idempotency_key.slice(0, 8)}`,
    )
    if (!result) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "No order found for that idempotency_key" },
        { status: 404 },
      )
    }
    return NextResponse.json({ data: { ok: true, type: "order" } })
  }

  if (parsed.data.type === "tier") {
    // TODO: remove before launch — directly sets tier without payment
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Must be signed in" }, { status: 401 })
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { tier: parsed.data.tier },
      select: { id: true, username: true, tier: true },
    })

    return NextResponse.json({ data: { ok: true, type: "tier", user } })
  }

  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
}
