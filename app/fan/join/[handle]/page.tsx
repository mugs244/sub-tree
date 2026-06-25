import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

type Props = { params: Promise<{ handle: string }> }

export default async function FanJoinPage({ params }: Props) {
  const { handle } = await params
  const session = await getSession()

  // If already logged in, just follow and return to the creator
  if (session) {
    const creator = await prisma.user.findUnique({
      where: { username: handle },
      select: { id: true },
    })
    if (creator) {
      redirect(`/${handle}`)
    }
    redirect("/")
  }

  const cookieStore = await cookies()
  cookieStore.set("fan_redirect", `/${handle}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  })

  redirect("/sign-up")
}
