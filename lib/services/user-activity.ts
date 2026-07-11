import { prisma } from "@/lib/db"

export async function touchUserLastActive(userId: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { last_active_at: new Date() },
  })
}

// Fills country_code for profiles created before geo-tracking existed, or
// where it wasn't available at signup (e.g. local dev). No-ops cheaply once
// set — the where clause just won't match. Never overwrites an existing
// value, same rule as the signup-time snapshot.
export async function backfillProfileCountry(userId: number, countryCode: string | null) {
  if (!countryCode) return
  await prisma.profile.updateMany({
    where: { user_id: userId, country_code: null },
    data: { country_code: countryCode },
  })
}
