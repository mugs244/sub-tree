import { prisma } from "@/lib/db"
import { TERMS_VERSION } from "@/lib/legal"

// Append-only — never update or delete a row here. This is the audit trail
// proving a user agreed to a specific Terms revision at sign-up.
export async function recordTermsAcceptance(userId: number, ipAddress: string | null): Promise<void> {
  await prisma.termsAcceptance.create({
    data: {
      user_id: userId,
      terms_version: TERMS_VERSION,
      ip_address: ipAddress,
    },
  })
}
