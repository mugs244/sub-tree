import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createFundraiser, listFundraisers, FundraiserError } from "@/lib/services/fundraiser"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const data = await listFundraisers(userId)
    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof FundraiserError) {
      const status = err.code === "USER_NOT_FOUND" ? 404 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  try {
    const data = await createFundraiser(userId, body)
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    if (err instanceof FundraiserError) {
      const status = err.code === "FORBIDDEN" ? 403 : err.code === "USER_NOT_FOUND" ? 404 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
