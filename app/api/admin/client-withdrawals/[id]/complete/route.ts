import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { markClientWithdrawalCompleted } from "@/lib/services/client-wallet"
import { Prisma } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { id } = await params
  const withdrawalId = parseInt(id, 10)
  if (isNaN(withdrawalId)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  try {
    await markClientWithdrawalCompleted(withdrawalId)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND", message: "Withdrawal not found or already processed" }, { status: 404 })
    }
    throw err
  }
}
