import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { adminDecide, VerificationError } from "@/lib/services/verification"

const schema = z.object({ approve: z.boolean() })
type Props = { params: Promise<{ id: string }> }

// Admin decision on a verification Smile ID flagged for review.
export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const id = Number((await params).id)
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!Number.isInteger(id) || !parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  try {
    await adminDecide(id, parsed.data.approve, session.userId)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof VerificationError) return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    throw err
  }
}
