import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { checkRateLimit } from "@/lib/rateLimit"
import { subscribeToDonationLaunch, DonationLaunchError } from "@/lib/services/donation-launch"

const schema = z.object({ email: z.string().min(3).max(200) })

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Enter a valid email address" }, { status: 400 })
  }

  const rl = checkRateLimit(`donation-launch-notify:${parsed.data.email.toLowerCase()}`, { windowMs: 60 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED", message: "Too many attempts. Please try again later." }, { status: 429 })
  }

  const session = await getSession()

  try {
    await subscribeToDonationLaunch(parsed.data.email, session?.userId)
    return NextResponse.json({ data: null }, { status: 201 })
  } catch (err) {
    if (err instanceof DonationLaunchError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
