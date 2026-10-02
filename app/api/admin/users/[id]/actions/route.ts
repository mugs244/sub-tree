import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { revokeBadge, signOutEverywhere } from "@/lib/services/admin-console"
import { adminExtendSubscription } from "@/lib/services/billing"

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revoke_badge") }),
  z.object({ action: z.literal("extend_subscription"), months: z.number().int().min(1).max(24) }),
  z.object({ action: z.literal("sign_out_all") }),
])
type Props = { params: Promise<{ id: string }> }

// Admin actions on one creator, from Admin → Users → (creator).
export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const userId = Number((await params).id)
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!Number.isInteger(userId) || !parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  const a = parsed.data
  if (a.action === "revoke_badge") {
    await revokeBadge(userId)
    return NextResponse.json({ data: { message: "Badge removed. They'd need a new ID check to get it back." } })
  }
  if (a.action === "extend_subscription") {
    const end = await adminExtendSubscription(userId, a.months)
    return NextResponse.json({ data: { message: `Subscription extended to ${end.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}.` } })
  }
  const count = await signOutEverywhere(userId)
  return NextResponse.json({ data: { message: `Signed out of ${count} ${count === 1 ? "session" : "sessions"}.` } })
}
