import { NextResponse } from "next/server"
import { getDonationLaunchStatusForViewer } from "@/lib/services/donation-launch"

export async function GET(): Promise<NextResponse> {
  // Admins in test mode see donations as open (the notice hides for them).
  const status = await getDonationLaunchStatusForViewer()
  return NextResponse.json({
    data: { enabled: status.enabled, launchAt: status.launchAt?.toISOString() ?? null },
  })
}
