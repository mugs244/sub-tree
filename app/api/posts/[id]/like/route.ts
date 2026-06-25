import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { likePost, unlikePost, PostError } from "@/lib/services/posts"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    await likePost(userId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof PostError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "ALREADY_LIKED" ? 409 : 400
      return NextResponse.json({ error: err.code }, { status })
    }
    throw err
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    await unlikePost(userId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof PostError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "NOT_LIKED" ? 409 : 400
      return NextResponse.json({ error: err.code }, { status })
    }
    throw err
  }
}
