import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { saveProfile, ProfileError } from "@/lib/services/profile"
import { getCountryFromHeaders } from "@/lib/utils/geo"

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  try {
    await saveProfile(userId, body, getCountryFromHeaders(req.headers))
    return NextResponse.json({ data: null }, { status: 200 })
  } catch (err) {
    if (err instanceof ProfileError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
