import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { deleteTier, TierError, updateTier } from "@/lib/services/membership-tiers"

function getTierId(id: string) {
  const parsedId = parseInt(id, 10)
  if (Number.isNaN(parsedId)) throw new Error("Invalid tier id")
  return parsedId
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const userId = session.userId

  const { id } = await params
  const tierId = getTierId(id)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    await updateTier(userId, tierId, body)
    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    if (error instanceof TierError) {
      const status =
        error.code === "VALIDATION_ERROR"
          ? 400
          : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
          ? 404
          : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error(error)
    return NextResponse.json({ error: "Unable to update tier" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const userId = session.userId

  const { id } = await params
  const tierId = getTierId(id)
  try {
    await deleteTier(userId, tierId)
    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    if (error instanceof TierError) {
      const status =
        error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
          ? 404
          : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error(error)
    return NextResponse.json({ error: "Unable to delete tier" }, { status: 500 })
  }
}
