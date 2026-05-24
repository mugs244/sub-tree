import { NextResponse } from "next/server"
import { runWeeklyPayouts } from "@/lib/services/affiliate"

export async function POST(req: Request): Promise<NextResponse> {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const results = await runWeeklyPayouts()
    return NextResponse.json({ data: results })
  } catch (err) {
    console.error("Affiliate payout cron error", err)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
