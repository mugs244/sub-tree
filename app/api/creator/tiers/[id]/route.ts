import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteTier, TierError, updateTier } from "@/lib/services/membership-tiers"

function getTierId(params: { id?: string }) {
  const id = params.id ? parseInt(params.id, 10) : NaN
  if (Number.isNaN(id)) throw new Error("Invalid tier id")
  return id
}

export async function PATCH(req: Request, { params }: { params: { id?: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const tierId = getTierId(params)
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

export async function DELETE(_req: Request, { params }: { params: { id?: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const tierId = getTierId(params)
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
