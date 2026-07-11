import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { getDonationLaunchStatus, setDonationLaunchStatus, countPendingSubscribers } from "@/lib/services/donation-launch"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const [status, pendingSubscribers] = await Promise.all([
    getDonationLaunchStatus(),
    countPendingSubscribers(),
  ])

  return NextResponse.json({
    data: { enabled: status.enabled, launchAt: status.launchAt?.toISOString() ?? null, pendingSubscribers },
  })
}

const schema = z.object({
  enabled: z.boolean(),
  launchAt: z.string().nullable(),
})

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }

  let launchAt: Date | null = null
  if (parsed.data.launchAt) {
    launchAt = new Date(parsed.data.launchAt)
    if (isNaN(launchAt.getTime())) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid launch date" }, { status: 400 })
    }
  }

  const result = await setDonationLaunchStatus(parsed.data.enabled, launchAt, session.userId)
  return NextResponse.json({ data: result })
}
