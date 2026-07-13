import { NextResponse } from "next/server"
import { getSession, destroySession } from "@/lib/auth/session"
import { notifyAccountDeleted } from "@/lib/services/security-notify"
import { prisma } from "@/lib/db"

export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, phone: true },
  })
  if (!user) return NextResponse.json({ error: "NOT_FOUND", message: "User not found" }, { status: 404 })

  // Soft-delete: mark deleted_at, clear username so it's reclaimable.
  // The email column is unique at the DB level, so it also has to be
  // mangled here — otherwise it stays locked forever and this person could
  // never sign up again with the same address. The original is still
  // recoverable from the mangled value (userId + local part are preserved),
  // just no longer usable to sign up until an admin says otherwise.
  const [localPart, domain] = user.email.split("@")
  const reclaimableEmail = `${localPart}+deleted-${user.id}@${domain}`

  await prisma.user.update({
    where: { id: user.id },
    data: { deleted_at: new Date(), username: null, email: reclaimableEmail },
  })

  // Destroy the session so the user is signed out
  await destroySession()

  await notifyAccountDeleted(user.email, user.phone)

  return NextResponse.json({ data: null })
}
