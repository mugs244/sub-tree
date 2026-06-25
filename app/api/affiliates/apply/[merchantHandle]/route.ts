import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { applyAsAffiliate, AffiliateError } from "@/lib/services/affiliate"

type Props = { params: Promise<{ merchantHandle: string }> }

export async function POST(_req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  const { merchantHandle } = await params

  try {
    await applyAsAffiliate(userId, merchantHandle)
    return NextResponse.json({ data: { ok: true } }, { status: 201 })
  } catch (err) {
    if (err instanceof AffiliateError) {
      const status = err.code === "WRONG_TIER" ? 403
        : err.code === "NOT_FOUND" ? 404
        : err.code === "ALREADY_EXISTS" ? 409
        : err.code === "SELF_REFERRAL" ? 422 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
