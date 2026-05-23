import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listIncomingCampaignRequests, FundraiserError } from "@/lib/services/fundraiser"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const data = await listIncomingCampaignRequests(userId)
    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof FundraiserError) {
      const status = err.code === "USER_NOT_FOUND" ? 404 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
