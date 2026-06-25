import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listInboundRequests, AffiliateError } from "@/lib/services/affiliate"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  try {
    const requests = await listInboundRequests(userId)
    return NextResponse.json({ data: requests })
  } catch (err) {
    if (err instanceof AffiliateError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
