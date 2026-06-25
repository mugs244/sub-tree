import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { checkUsernameAvailability } from "@/lib/services/username"

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const username = searchParams.get("username") ?? ""

  const availability = await checkUsernameAvailability(username)
  return NextResponse.json(availability)
}
