import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ username: string }> }

export async function POST(_req: Request, { params }: Params): Promise<NextResponse> {
  const { username } = await params

  await prisma.profile.updateMany({
    where: { user: { username, deleted_at: null } },
    data: { view_count: { increment: 1 } },
  }).catch(() => {})

  return new NextResponse(null, { status: 204 })
}
