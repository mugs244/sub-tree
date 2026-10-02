import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { markSubmitted, VerificationError } from "@/lib/services/verification"

const schema = z.object({ smileUserId: z.string().min(1), jobId: z.string().nullable().optional() })

// Step 3: the widget finished uploading. No verdict yet — that only comes
// from Smile ID's webhook, never from the browser.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  try {
    await markSubmitted(session.userId, parsed.data.smileUserId, parsed.data.jobId ?? null)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof VerificationError) return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    throw err
  }
}
