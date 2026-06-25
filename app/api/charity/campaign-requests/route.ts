import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listIncomingCampaignRequests, FundraiserError } from "@/lib/services/fundraiser"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  try {
    const data = await listIncomingCampaignRequests(userId)
    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof FundraiserError) {
      const status = 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
