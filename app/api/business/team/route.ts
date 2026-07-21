import { NextResponse } from "next/server"
import { AdvertiserRole } from "@prisma/client"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listTeam, inviteMember, AdvertiserTeamError } from "@/lib/services/advertiser-team"

const ROLES = new Set(Object.values(AdvertiserRole))

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const members = await listTeam(advertiser.id)
  return NextResponse.json({ data: members, viewerRole: advertiser.role, viewerUserId: session.userId })
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { email, role } = (body ?? {}) as { email?: string; role?: string }
  if (!email || typeof email !== "string" || !role || !ROLES.has(role as AdvertiserRole)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "A valid email and role are required" }, { status: 400 })
  }

  try {
    const result = await inviteMember({ advertiserId: advertiser.id, actorRole: advertiser.role, email, role: role as AdvertiserRole })
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof AdvertiserTeamError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
