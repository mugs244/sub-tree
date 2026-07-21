import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { submitForVerification, AdvertiserSettingsError } from "@/lib/services/advertiser-settings"

export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  try {
    await submitForVerification(advertiser.id, advertiser.role)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AdvertiserSettingsError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 400 })
    }
    throw err
  }
}
