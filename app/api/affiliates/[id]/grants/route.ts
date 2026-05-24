import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { updateGrants, AffiliateError } from "@/lib/services/affiliate"

type Props = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Props): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  try {
    await updateGrants(userId, id, body)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AffiliateError) {
      const status = err.code === "FORBIDDEN" ? 403 : err.code === "NOT_FOUND" ? 404 : 422
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
