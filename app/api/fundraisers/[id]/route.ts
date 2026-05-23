import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { updateFundraiser, FundraiserError } from "@/lib/services/fundraiser"

type Params = { params: Promise<{ id: string }> }

function parseId(raw: string) {
  const n = parseInt(raw, 10)
  return isNaN(n) ? null : n
}

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { id: raw } = await params
  const id = parseId(raw)
  if (!id) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  try {
    await updateFundraiser(userId, id, body)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof FundraiserError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "FORBIDDEN" ? 403 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
