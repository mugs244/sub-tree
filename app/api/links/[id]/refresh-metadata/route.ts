import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { refreshLinkMeta, LinkError } from "@/lib/services/link"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const linkId = parseInt(id, 10)
  if (isNaN(linkId)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    await refreshLinkMeta(userId, linkId)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof LinkError) {
      const status = err.code === "LINK_NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
