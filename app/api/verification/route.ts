import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getVerificationState } from "@/lib/services/verification"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  return NextResponse.json({ data: await getVerificationState(session.userId) })
}
