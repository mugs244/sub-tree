import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { resolveDispute, ShopError } from "@/lib/services/shop"
import { z } from "zod"

type Props = { params: Promise<{ id: string }> }

const ADMIN_IDS = (process.env.ADMIN_CLERK_IDS ?? "").split(",").filter(Boolean)
const schema = z.object({ action: z.enum(["release", "refund"]) })

export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { id: raw } = await params
  const orderId = parseInt(raw, 10)
  if (isNaN(orderId)) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 })
  }

  try {
    await resolveDispute(orderId, parsed.data.action)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof ShopError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 422 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
