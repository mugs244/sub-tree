import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listPayouts, AffiliateError } from "@/lib/services/affiliate"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  try {
    const payouts = await listPayouts(userId)
    return NextResponse.json({ data: payouts })
  } catch (err) {
    if (err instanceof AffiliateError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
