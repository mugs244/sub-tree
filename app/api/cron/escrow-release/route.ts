import { NextResponse } from "next/server"
import { runEscrowRelease } from "@/lib/services/shop"

export async function GET(req: Request): Promise<NextResponse> {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const results = await runEscrowRelease()
    return NextResponse.json({ data: results })
  } catch (err) {
    console.error("Escrow release cron error", err)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
