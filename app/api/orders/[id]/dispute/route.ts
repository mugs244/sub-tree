import { NextResponse } from "next/server"
import { raiseDispute, ShopError } from "@/lib/services/shop"
import { z } from "zod"

type Props = { params: Promise<{ id: string }> }

const schema = z.object({ buyer_phone: z.string().min(9) })

export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const { id: raw } = await params
  const orderId = parseInt(raw, 10)
  if (isNaN(orderId)) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 })
  }

  try {
    await raiseDispute(orderId, parsed.data.buyer_phone)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof ShopError) {
      const status = err.code === "FORBIDDEN" ? 403
        : err.code === "ORDER_NOT_FOUND" ? 404
        : err.code === "ALREADY_DISPUTED" || err.code === "ESCROW_NOT_HELD" ? 422 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
