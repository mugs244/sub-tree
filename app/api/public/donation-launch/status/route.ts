import { NextResponse } from "next/server"
import { getDonationLaunchStatus } from "@/lib/services/donation-launch"

export async function GET(): Promise<NextResponse> {
  const status = await getDonationLaunchStatus()
  return NextResponse.json({
    data: { enabled: status.enabled, launchAt: status.launchAt?.toISOString() ?? null },
  })
}
