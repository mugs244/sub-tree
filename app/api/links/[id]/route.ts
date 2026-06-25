import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateLink, deleteLink, LinkError } from "@/lib/services/link"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { id } = await params
  const linkId = parseInt(id, 10)
  if (isNaN(linkId)) return NextResponse.json({ error: "INVALID_ID", message: "Invalid link id" }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  try {
    await updateLink(userId, linkId, body)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof LinkError) {
      const status = err.code === "LINK_NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { id } = await params
  const linkId = parseInt(id, 10)
  if (isNaN(linkId)) return NextResponse.json({ error: "INVALID_ID", message: "Invalid link id" }, { status: 400 })

  try {
    await deleteLink(userId, linkId)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof LinkError) {
      const status = err.code === "LINK_NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
