import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { fetchSmartCardMeta } from "@/lib/services/smart-links"

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 })

  try {
    new URL(url) // validate URL shape before fetching
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  const meta = await fetchSmartCardMeta(url).catch(() => null)
  return NextResponse.json({ meta })
}
