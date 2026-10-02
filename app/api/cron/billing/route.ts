import { NextResponse } from "next/server"
import { runBillingCycle } from "@/lib/services/subscription"
import { runVerificationBilling } from "@/lib/services/billing"

// Vercel Cron — runs daily at 06:00 UTC (configured in vercel.json)
// Secures the endpoint with CRON_SECRET env var
export async function GET(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("Authorization")
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const result = await runBillingCycle()
  // Verification badge: renewal reminders, wallet auto-renew and lapses.
  const verification = await runVerificationBilling()
  console.log("Billing cycle complete", result, verification)
  return NextResponse.json({ ok: true, ...result, verification })
}
