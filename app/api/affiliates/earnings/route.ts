import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getEarnings, AffiliateError } from "@/lib/services/affiliate"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  try {
    const earnings = await getEarnings(userId)
    return NextResponse.json({
      data: {
        pending_amount: Number(earnings.pending_amount),
        pending_count: earnings.pending_count,
        paid_amount: Number(earnings.paid_amount),
        paid_count: earnings.paid_count,
      },
    })
  } catch (err) {
    if (err instanceof AffiliateError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
