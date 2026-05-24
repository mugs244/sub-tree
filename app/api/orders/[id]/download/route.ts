import { NextResponse } from "next/server"
import { getDownloadUrl, ShopError } from "@/lib/services/shop"

type Props = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Props): Promise<NextResponse> {
  const { id: raw } = await params
  const orderId = parseInt(raw, 10)
  if (isNaN(orderId)) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ error: "VALIDATION_ERROR", message: "token required" }, { status: 400 })

  try {
    const fileUrl = await getDownloadUrl(orderId, token)
    if (!fileUrl) return NextResponse.json({ error: "NOT_FOUND", message: "No file available" }, { status: 404 })
    return NextResponse.redirect(fileUrl)
  } catch (err) {
    if (err instanceof ShopError) {
      const status = err.code === "DOWNLOAD_EXPIRED" || err.code === "DOWNLOAD_LIMIT" || err.code === "DOWNLOAD_INVALID" ? 410 : 404
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
