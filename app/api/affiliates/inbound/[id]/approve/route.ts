import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { approveRequest, AffiliateError } from "@/lib/services/affiliate"

type Props = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  try {
    await approveRequest(userId, id, body)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AffiliateError) {
      const status = err.code === "FORBIDDEN" ? 403 : err.code === "NOT_FOUND" ? 404 : err.code === "VALIDATION_ERROR" ? 400 : 422
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
