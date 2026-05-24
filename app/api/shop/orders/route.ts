import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listMyOrders, ShopError } from "@/lib/services/shop"

export async function GET(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

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
