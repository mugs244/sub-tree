import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { isAdmin, approveClaim, rejectClaim } from "@/lib/services/admin"

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  message: z.string().max(300).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId || !isAdmin(userId)) return new NextResponse("Forbidden", { status: 403 })

  const { id } = await params
  const claimId = parseInt(id, 10)
  if (isNaN(claimId)) {
    return NextResponse.json({ error: "INVALID_ID", message: "Invalid claim id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  try {
    if (parsed.data.action === "approve") {
      await approveClaim(claimId)
    } else {
      await rejectClaim(claimId, parsed.data.message)
    }
    return NextResponse.json({ data: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed"
    return NextResponse.json({ error: "ACTION_FAILED", message }, { status: 422 })
  }
}
