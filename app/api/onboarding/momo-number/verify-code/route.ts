import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { ugandaPhoneRegex } from "@/lib/validators/profile"
import { verifyPhoneCode } from "@/lib/services/phone-verification"
import { prisma } from "@/lib/db"

const schema = z.object({
  phone: z.string().regex(ugandaPhoneRegex),
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

  const valid = await verifyPhoneCode(session.userId, parsed.data.phone, parsed.data.code)
  if (!valid) {
    return NextResponse.json({ error: "INVALID_CODE", message: "Invalid or expired code" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { momo_number: parsed.data.phone, momo_number_verified_at: new Date() },
  })

  return NextResponse.json({ data: null })
}
