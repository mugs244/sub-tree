import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listMyOrders, ShopError } from "@/lib/services/shop"

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))

  try {
    const orders = await listMyOrders(userId, page)
    return NextResponse.json({ data: orders })
  } catch (err) {
    if (err instanceof ShopError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
