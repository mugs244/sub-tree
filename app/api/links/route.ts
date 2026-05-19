import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listLinks, addLink, LinkError } from "@/lib/services/link"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const links = await listLinks(userId)
  return NextResponse.json({ data: links })
}

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  try {
    await addLink(userId, body)
    return NextResponse.json({ data: null }, { status: 201 })
  } catch (err) {
    if (err instanceof LinkError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
