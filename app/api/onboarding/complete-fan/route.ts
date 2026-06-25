import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

export async function POST() {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fan_profile: { select: { id: true } } },
  })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const cookieStore = await cookies()
  const fanRedirect = cookieStore.get("fan_redirect")?.value ?? "/fan/feed"

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { account_type: "FAN" },
    }),
    ...(user.fan_profile
      ? []
      : [
          prisma.fanProfile.create({
            data: { user_id: user.id },
          }),
        ]),
  ])

  cookieStore.delete("fan_redirect")

  return NextResponse.json({ redirect: fanRedirect })
}
