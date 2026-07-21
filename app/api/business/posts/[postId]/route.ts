import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { deletePost, AdvertiserPostError } from "@/lib/services/advertiser-posts"

export async function DELETE(
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
    await deletePost(advertiser.id, postIdNum)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AdvertiserPostError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.code === "NOT_FOUND" ? 404 : 400 })
    }
    throw err
  }
}
