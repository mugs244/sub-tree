import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { releaseBySeller, ShopError } from "@/lib/services/shop"

type Props = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Props): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { id: raw } = await params
  const orderId = parseInt(raw, 10)
  if (isNaN(orderId)) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  try {
    await releaseBySeller(userId, orderId)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof ShopError) {
      const status = err.code === "FORBIDDEN" ? 403 : err.code === "ORDER_NOT_FOUND" ? 404 : 422
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
