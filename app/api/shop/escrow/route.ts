import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getEscrowSummary, ShopError } from "@/lib/services/shop"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  try {
    const summary = await getEscrowSummary(userId)
    return NextResponse.json({
      data: {
        held_amount: Number(summary.held_amount),
        held_count: summary.held_count,
        disputed_count: summary.disputed_count,
        next_release_at: summary.next_release_at,
      },
    })
  } catch (err) {
    if (err instanceof ShopError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
