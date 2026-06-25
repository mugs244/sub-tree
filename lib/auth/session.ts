import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { randomBytes } from "crypto"

const COOKIE = "st_session"
const TTL_DAYS = 30

export interface Session {
  userId: number
  email: string
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expires_at = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({ data: { user_id: userId, token, expires_at } })

  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expires_at,
  })

  return token
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expires_at: true,
      user: { select: { id: true, email: true, deleted_at: true } },
    },
  })

  if (!session || session.expires_at < new Date()) return null
  if (session.user.deleted_at) return null

  return { userId: session.user.id, email: session.user.email }
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {})
  }
  store.delete(COOKIE)
}
