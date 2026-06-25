import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { claimUsernameSchema } from "@/lib/validators/username"
import { requestReservedUsername, UsernameError } from "@/lib/services/username"

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

  const parsed = claimUsernameSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  try {
    await requestReservedUsername(userId, parsed.data.username)
    return NextResponse.json({ data: null }, { status: 202 })
  } catch (err) {
    if (err instanceof UsernameError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
