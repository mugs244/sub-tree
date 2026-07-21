import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listComments, addComment, AdvertiserPostError } from "@/lib/services/advertiser-posts"

// The business reads comments on its own post — advertiser-scoped.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const { postId } = await params
  const postIdNum = Number(postId)
  if (!Number.isInteger(postIdNum)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid post id" }, { status: 400 })
  }

  try {
    const comments = await listComments(advertiser.id, postIdNum)
    return NextResponse.json({ data: comments })
  } catch (err) {
    if (err instanceof AdvertiserPostError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 404 })
    }
    throw err
  }
}

// Any logged-in user can comment (they'd reach the post from the public
// surface) — not advertiser-scoped.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { postId } = await params
  const postIdNum = Number(postId)
  if (!Number.isInteger(postIdNum)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid post id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { comment } = (body ?? {}) as { comment?: string }
  if (typeof comment !== "string") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "comment is required" }, { status: 400 })
  }

  try {
    const result = await addComment(postIdNum, session.userId, comment)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof AdvertiserPostError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.code === "NOT_FOUND" ? 404 : 400 })
    }
    throw err
  }
}
