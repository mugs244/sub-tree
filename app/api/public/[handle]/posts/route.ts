import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getPublicPosts } from "@/lib/services/posts"

type Params = { params: Promise<{ handle: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession()
  const { handle } = await params

  const data = await getPublicPosts(handle, session?.userId ?? null)
  if (data === null) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ data })
}
