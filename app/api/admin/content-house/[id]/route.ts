import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

const VALID_STATUSES = ["REVIEWING", "APPROVED", "REJECTED"] as const
type Status = (typeof VALID_STATUSES)[number]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId || !isAdmin(userId)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return new NextResponse("Bad request", { status: 400 })

  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }

  if (!body.status || !VALID_STATUSES.includes(body.status as Status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 })
  }

  const updated = await prisma.contentHouseRequest.updateMany({
    where: { id },
    data: {
      status: body.status as Status,
      reviewed_by: userId,
      reviewed_at: new Date(),
    },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
