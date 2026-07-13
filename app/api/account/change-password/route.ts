import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { notifyPasswordChanged } from "@/lib/services/security-notify"
import { prisma } from "@/lib/db"

const schema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
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

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { password_hash: true },
  })
  if (!user?.password_hash) {
    return NextResponse.json(
      { error: "NO_PASSWORD_SET", message: "No password set on this account — use \"Forgot password\" to set one" },
      { status: 400 },
    )
  }

  const valid = await verifyPassword(parsed.data.current_password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: "INCORRECT_PASSWORD", message: "Current password is incorrect" }, { status: 400 })
  }

  const password_hash = await hashPassword(parsed.data.new_password)
  await prisma.user.update({ where: { id: session.userId }, data: { password_hash } })

  // Sign out other sessions on the account (defense in depth), keep this one alive.
  const currentToken = (await cookies()).get("st_session")?.value
  await prisma.session.deleteMany({
    where: { user_id: session.userId, ...(currentToken ? { token: { not: currentToken } } : {}) },
  })

  await notifyPasswordChanged(session.userId)

  return NextResponse.json({ data: null })
}
