import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getPublicPosts } from "@/lib/services/posts"

type Params = { params: Promise<{ handle: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth()
  const { handle } = await params

  const data = await getPublicPosts(handle, userId ?? null)
  if (data === null) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ data })
}
