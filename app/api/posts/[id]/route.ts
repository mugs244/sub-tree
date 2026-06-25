import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updatePost, deletePost, PostError } from "@/lib/services/posts"

type Params = { params: Promise<{ id: string }> }

function parseId(raw: string) {
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseId(raw)
  if (!id) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    const body = await req.json()
    await updatePost(userId, id, body)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof PostError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 422
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseId(raw)
  if (!id) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    await deletePost(userId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof PostError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code }, { status })
    }
    throw err
  }
}
