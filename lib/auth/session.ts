import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { randomBytes } from "crypto"

const COOKIE = "st_session"
const TTL_DAYS = 30

export interface Session {
  userId: number
  email: string
}

function cookieOpts(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  }
}

export async function createSession(userId: number): Promise<{ token: string; expires_at: Date }> {
  const token = randomBytes(32).toString("hex")
  const expires_at = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { user_id: userId, token, expires_at } })
  return { token, expires_at }
}

export function applySessionCookie<T>(res: NextResponse<T>, token: string, expires_at: Date): NextResponse<T> {
  res.cookies.set(COOKIE, token, cookieOpts(expires_at))
  return res
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  let token = store.get(COOKIE)?.value

  // Mobile clients (no browser cookie jar) send the same token as a bearer
  // header instead — falls back here so every existing call site stays a
  // zero-arg `getSession()`, web and mobile both just work.
  if (!token) {
    const hdrs = await headers()
    const auth = hdrs.get("authorization")
    if (auth?.startsWith("Bearer ")) token = auth.slice(7)
  }

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
