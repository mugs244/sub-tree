import { NextResponse } from "next/server"
import { recordLinkClick } from "@/lib/services/link"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params
  const linkId = parseInt(id, 10)
  if (isNaN(linkId)) return new NextResponse(null, { status: 204 })

  await recordLinkClick(linkId)
  return new NextResponse(null, { status: 204 })
}
