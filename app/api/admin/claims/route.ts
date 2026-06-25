import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin, listClaims } from "@/lib/services/admin"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) return new NextResponse("Forbidden", { status: 403 })

  const claims = await listClaims("PENDING")
  return NextResponse.json({ data: claims })
}
