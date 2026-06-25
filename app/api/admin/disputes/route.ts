import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { listAdminDisputes } from "@/lib/services/shop"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const disputes = await listAdminDisputes()
  return NextResponse.json({ data: disputes })
}
