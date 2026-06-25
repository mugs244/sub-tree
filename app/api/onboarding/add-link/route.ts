import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { addLink, LinkError } from "@/lib/services/link"

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  try {
    await addLink(userId, body)
    return NextResponse.json({ data: null }, { status: 200 })
  } catch (err) {
    if (err instanceof LinkError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
