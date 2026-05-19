import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { checkUsernameAvailability } from "@/lib/services/username"

export async function GET(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const username = searchParams.get("username") ?? ""

  const availability = await checkUsernameAvailability(username)
  return NextResponse.json(availability)
}
