import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { activateFundraiser, FundraiserError } from "@/lib/services/fundraiser"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    await activateFundraiser(userId, id)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof FundraiserError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
