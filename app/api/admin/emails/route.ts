import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { EMAIL_KEYS, sendTestEmails } from "@/lib/services/email-tester"

// "Send all" paces itself under Resend's rate limit, so it needs a while.
export const maxDuration = 120

const schema = z.object({ keys: z.array(z.string()).min(1).max(EMAIL_KEYS.length) })

// Admin → Emails: send test copies to the signed-in admin's own inbox.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success || parsed.data.keys.some((k) => !EMAIL_KEYS.includes(k))) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }

  return NextResponse.json({ data: await sendTestEmails(session.userId, parsed.data.keys) })
}
