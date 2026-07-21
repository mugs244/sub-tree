import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listPosts, createPost, AdvertiserPostError } from "@/lib/services/advertiser-posts"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const posts = await listPosts(advertiser.id)
  return NextResponse.json({ data: posts })
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { content } = (body ?? {}) as { content?: string }
  if (typeof content !== "string") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "content is required" }, { status: 400 })
  }

  try {
    const result = await createPost(advertiser.id, session.userId, content)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof AdvertiserPostError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
