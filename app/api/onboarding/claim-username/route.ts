import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { claimUsernameSchema } from "@/lib/validators/username"
import { claimUsername, UsernameError } from "@/lib/services/username"

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

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
    await claimUsername(userId, parsed.data.username)
    return NextResponse.json({ data: { username: parsed.data.username } }, { status: 200 })
  } catch (err) {
    if (err instanceof UsernameError) {
      const status =
        err.code === "USERNAME_TAKEN" || err.code === "USERNAME_RESERVED" ? 409 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
