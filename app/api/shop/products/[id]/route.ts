import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateProduct, deactivateProduct, ShopError } from "@/lib/services/shop"

type Props = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid product id" }, { status: 400 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  try {
    await updateProduct(userId, id, body)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof ShopError) {
      const status = err.code === "FORBIDDEN" ? 403 : err.code === "NOT_FOUND" ? 404 : err.code === "VALIDATION_ERROR" ? 400 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid product id" }, { status: 400 })

  try {
    await deactivateProduct(userId, id)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof ShopError) {
      const status = err.code === "FORBIDDEN" ? 403 : err.code === "NOT_FOUND" ? 404 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
