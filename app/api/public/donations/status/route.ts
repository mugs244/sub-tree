import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Public — the ref is an unguessable UUID (the donation's idempotency_key),
// same capability-token pattern already used by /order-success?ref=.
export async function GET(req: Request): Promise<NextResponse> {
  const ref = new URL(req.url).searchParams.get("ref")
  if (!ref) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Missing ref" }, { status: 400 })

  const donation = await prisma.donation.findUnique({
    where: { idempotency_key: ref },
    select: { status: true },
  })
  if (!donation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ data: { status: donation.status } })
}
