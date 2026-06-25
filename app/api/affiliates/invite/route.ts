import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { inviteAffiliate, AffiliateError } from "@/lib/services/affiliate"

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  try {
    await inviteAffiliate(userId, body)
    return NextResponse.json({ data: { ok: true } }, { status: 201 })
  } catch (err) {
    if (err instanceof AffiliateError) {
      const status = err.code === "WRONG_TIER" || err.code === "FORBIDDEN" ? 403
        : err.code === "NOT_FOUND" ? 404
        : err.code === "ALREADY_EXISTS" ? 409
        : err.code === "VALIDATION_ERROR" ? 400 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
