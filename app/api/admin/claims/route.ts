import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { isAdmin, listClaims } from "@/lib/services/admin"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId || !isAdmin(userId)) return new NextResponse("Forbidden", { status: 403 })

  const claims = await listClaims("PENDING")
  return NextResponse.json({ data: claims })
}
