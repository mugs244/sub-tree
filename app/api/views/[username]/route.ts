import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { checkRateLimit } from "@/lib/rateLimit"

type Params = { params: Promise<{ username: string }> }

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { username } = await params

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  try {
    await checkRateLimit({ key: `view:${ip}` })
  } catch {
    return new NextResponse(null, { status: 429, headers: { "Retry-After": "60" } })
  }

  // Check if viewer is the profile owner
  const { userId } = await auth()
  if (userId) {
    const owner = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
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
