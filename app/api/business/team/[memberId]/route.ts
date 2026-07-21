import { NextResponse } from "next/server"
import { AdvertiserRole } from "@prisma/client"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { updateMemberRole, removeMember, AdvertiserTeamError } from "@/lib/services/advertiser-team"

const ROLES = new Set(Object.values(AdvertiserRole))

function errStatus(code: AdvertiserTeamError["code"]): number {
  if (code === "NOT_FOUND") return 404
  if (code === "FORBIDDEN") return 403
  return 400
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const { memberId } = await params
  const memberIdNum = Number(memberId)
  if (!Number.isInteger(memberIdNum)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid member id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { role } = (body ?? {}) as { role?: string }
  if (!role || !ROLES.has(role as AdvertiserRole)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "A valid role is required" }, { status: 400 })
  }

  try {
    await updateMemberRole({ advertiserId: advertiser.id, actorRole: advertiser.role, memberId: memberIdNum, role: role as AdvertiserRole })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AdvertiserTeamError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: errStatus(err.code) })
    }
    throw err
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const { memberId } = await params
  const memberIdNum = Number(memberId)
  if (!Number.isInteger(memberIdNum)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid member id" }, { status: 400 })
  }

  try {
    await removeMember({ advertiserId: advertiser.id, actorRole: advertiser.role, actorUserId: session.userId, memberId: memberIdNum })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AdvertiserTeamError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: errStatus(err.code) })
    }
    throw err
  }
}
