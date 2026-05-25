import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { followCreator, unfollowCreator, FanError } from "@/lib/services/fan"

type Params = { params: Promise<{ handle: string }> }

function handleFanError(err: FanError) {
  if (err.code === "CREATOR_NOT_FOUND") return NextResponse.json({ error: err.code }, { status: 404 })
  if (err.code === "SELF_FOLLOW") return NextResponse.json({ error: err.code }, { status: 422 })
  if (err.code === "ALREADY_FOLLOWING" || err.code === "NOT_FOLLOWING") {
    return NextResponse.json({ error: err.code }, { status: 409 })
  }
  return NextResponse.json({ error: err.code }, { status: 400 })
}

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { handle } = await params
  try {
    await followCreator(userId, handle)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof FanError) return handleFanError(err)
    throw err
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { handle } = await params
  try {
    await unfollowCreator(userId, handle)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof FanError) return handleFanError(err)
    throw err
  }
}
