import { prisma } from "@/lib/db"
import { recordTermsAcceptance } from "@/lib/services/terms-acceptance"

// Resolves a Google/Apple login (an email the provider has already verified)
// to a Sub-tree user, creating one on first sign-in. Accounts are matched by
// email, so someone who signed up with a password can later use Google with
// the same address and land in the same account.
export async function findOrCreateOAuthUser(
  email: string,
  ipAddress: string | null,
): Promise<{ userId: number; created: boolean }> {
  const normalized = email.trim().toLowerCase()

  const existing = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" }, deleted_at: null },
    select: { id: true, email_verified_at: true },
  })

  if (existing) {
    if (!existing.email_verified_at) {
      // An unverified password account on this email was never proven to
      // belong to anyone — possibly someone squatting the address. The OAuth
      // login proves ownership, so verify the email and drop that password
      // so the squatter can't keep signing in alongside the real owner.
      await prisma.user.update({
        where: { id: existing.id },
        data: { email_verified_at: new Date(), password_hash: null },
      })
    }
    return { userId: existing.id, created: false }
  }

  const user = await prisma.user.create({
    data: { email: normalized, email_verified_at: new Date() },
    select: { id: true },
  })
  // Both sign-up and sign-in show a Terms notice right under the
  // Google/Apple buttons, so continuing is the agreement.
  await recordTermsAcceptance(user.id, ipAddress)
  return { userId: user.id, created: true }
}
