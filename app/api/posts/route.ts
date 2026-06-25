import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createPost, listCreatorPosts, PostError } from "@/lib/services/posts"

export async function GET() {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  try {
    const data = await listCreatorPosts(userId)
    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof PostError) return NextResponse.json({ error: err.code }, { status: 400 })
    throw err
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  try {
    const body = await req.json()
    const data = await createPost(userId, body)
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    if (err instanceof PostError) {
      const status = err.code === "VALIDATION_ERROR" ? 422 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
