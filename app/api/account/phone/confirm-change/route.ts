import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { ugandaPhoneRegex } from "@/lib/validators/profile"
import { confirmNumberChange, NumberChangeError } from "@/lib/services/number-change"

const schema = z.object({
  new_phone: z.string().regex(ugandaPhoneRegex),
  code: z.string().length(6),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  try {
    await confirmNumberChange(session.userId, "phone", parsed.data.new_phone, parsed.data.code)
  } catch (err) {
    if (err instanceof NumberChangeError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }

  return NextResponse.json({ data: { phone: parsed.data.new_phone } })
}
