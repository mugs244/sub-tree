import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/auth/email"
import { z } from "zod"

const schema = z.object({ userId: z.number().int().positive() })

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { email: true, email_verified_at: true },
  })
  if (!user || user.email_verified_at) {
    return NextResponse.json({ error: "Not applicable" }, { status: 400 })
  }

  await sendVerificationEmail(parsed.data.userId, user.email)
  return NextResponse.json({ ok: true })
}
