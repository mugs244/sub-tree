import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { saveProfile, ProfileError } from "@/lib/services/profile"

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  try {
    await saveProfile(userId, body)
    return NextResponse.json({ data: null }, { status: 200 })
  } catch (err) {
    if (err instanceof ProfileError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
