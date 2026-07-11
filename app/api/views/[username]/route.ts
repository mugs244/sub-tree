import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

type Params = { params: Promise<{ username: string }> }

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { username } = await params

  // Rate limit by IP
  const rl = checkRateLimit(`view:${getClientIp(req)}`, { windowMs: 60_000, max: 10 })
  if (!rl.allowed) {
    return new NextResponse(null, { status: 429, headers: { "Retry-After": "60" } })
  }

  // Check if viewer is the profile owner
  const session = await getSession()
  if (session) {
    const owner = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true },
    })
    // Skip increment if viewer owns the profile
    if (owner?.username === username) return new NextResponse(null, { status: 204 })
  }

  await prisma.profile.updateMany({
    where: { user: { username, deleted_at: null } },
    data: { view_count: { increment: 1 } },
  }).catch(() => {})

  return new NextResponse(null, { status: 204 })
}
