import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { pinPost, PostError } from "@/lib/services/posts"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    await pinPost(userId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof PostError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code }, { status })
    }
    throw err
  }
}
