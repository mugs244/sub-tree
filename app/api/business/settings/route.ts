import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { updateCompanyName, AdvertiserSettingsError } from "@/lib/services/advertiser-settings"

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { companyName } = (body ?? {}) as { companyName?: string }
  if (typeof companyName !== "string") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "companyName is required" }, { status: 400 })
  }

  try {
    await updateCompanyName(advertiser.id, advertiser.role, companyName)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AdvertiserSettingsError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 400 })
    }
    throw err
  }
}
