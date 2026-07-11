import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { z } from "zod"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

const bodySchema = z.object({
  action: z.enum(["suspend", "reactivate"]),
  account_type: z.enum(["FAN", "INDIVIDUAL", "BUSINESS", "NGO"]).optional(),
})

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (Number.isNaN(id)) {
    return new NextResponse("Bad request", { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.action === "suspend") {
    data.deleted_at = new Date()
  } else {
    data.deleted_at = null
  }
  if (parsed.data.account_type) {
    data.account_type = parsed.data.account_type
  }

  await prisma.user.update({ where: { id }, data, select: { id: true } })
  return NextResponse.json({ ok: true })
}
