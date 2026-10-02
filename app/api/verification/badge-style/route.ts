import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { setBadgeStyle } from "@/lib/services/verification"
import { isBadgeStyle } from "@/components/VerifiedBadge"

// Save which verified badge the creator wants: { style: "classic" | "tree" }.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const style = body?.style
  if (!isBadgeStyle(style)) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Pick a badge style" }, { status: 400 })

  await setBadgeStyle(session.userId, style)
  return NextResponse.json({ data: { style } })
}
