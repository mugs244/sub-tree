import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listMyShops, AffiliateError } from "@/lib/services/affiliate"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  try {
    const shops = await listMyShops(userId)
    return NextResponse.json({ data: shops })
  } catch (err) {
    if (err instanceof AffiliateError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
