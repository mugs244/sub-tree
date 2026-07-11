import { NextResponse } from "next/server"
import { z } from "zod"
import { handleMomoCallback } from "@/lib/services/donation"

const BYPASS_KEY = process.env.BYPASS_PAYMENTS_KEY

const schema = z.object({
  type: z.literal("donation"),
  idempotency_key: z.uuid(),
})

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
