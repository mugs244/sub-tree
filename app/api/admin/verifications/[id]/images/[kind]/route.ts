import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { getReviewImage, IMAGE_KINDS, type ImageKind } from "@/lib/services/verification-images"

type Props = { params: Promise<{ id: string; kind: string }> }

// Admin-only: decrypts one ID review photo on request. Never cached.
export async function GET(_req: Request, { params }: Props): Promise<Response> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { id, kind } = await params
  if (!IMAGE_KINDS.includes(kind as ImageKind)) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const img = await getReviewImage(Number(id), kind as ImageKind)
  if (!img) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return new Response(new Uint8Array(img.body), {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
