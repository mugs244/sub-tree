import { NextResponse } from "next/server"
import { ContentMediaType } from "@prisma/client"
import { getSession } from "@/lib/auth/session"
import { createContentItem, listContentForCreator, ContentError } from "@/lib/services/content"

const MEDIA_TYPES = new Set(Object.values(ContentMediaType))

// A creator's own content items.
export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const items = await listContentForCreator(session.userId)
  return NextResponse.json({ data: items })
}

// Create a short-form content item. Media is an opaque reference (a Mux
// playback id or URL) — upload/transcoding is out of scope here.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { caption, mediaUrl, mediaType, durationSec } = (body ?? {}) as {
    caption?: string
    mediaUrl?: string
    mediaType?: string
    durationSec?: number
  }
  if (typeof mediaUrl !== "string") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "mediaUrl is required" }, { status: 400 })
  }
  if (mediaType !== undefined && !MEDIA_TYPES.has(mediaType as ContentMediaType)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid mediaType" }, { status: 400 })
  }

  try {
    const result = await createContentItem(session.userId, {
      caption: typeof caption === "string" ? caption : undefined,
      mediaUrl,
      mediaType: mediaType as ContentMediaType | undefined,
      durationSec: typeof durationSec === "number" ? durationSec : undefined,
    })
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof ContentError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
