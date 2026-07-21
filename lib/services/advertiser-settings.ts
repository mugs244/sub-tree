import { AdvertiserRole } from "@prisma/client"
import { prisma } from "@/lib/db"

export class AdvertiserSettingsError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "INVALID_NAME" | "ALREADY_SUBMITTED",
    message: string,
  ) {
    super(message)
    this.name = "AdvertiserSettingsError"
  }
}

export async function updateCompanyName(advertiserId: number, actorRole: AdvertiserRole, companyName: string): Promise<void> {
  if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
    throw new AdvertiserSettingsError("FORBIDDEN", "Only owners and admins can edit account settings")
  }
  const trimmed = companyName.trim()
  if (trimmed.length < 2) {
    throw new AdvertiserSettingsError("INVALID_NAME", "Company name must be at least 2 characters")
  }
  await prisma.advertiser.update({ where: { id: advertiserId }, data: { company_name: trimmed } })
}

// Verification is granted by an admin after onboarding; the advertiser can
// only move themselves from UNVERIFIED to PENDING (submit for review). The
// blue mark is set to VERIFIED admin-side, out of this flow.
export async function submitForVerification(advertiserId: number, actorRole: AdvertiserRole): Promise<void> {
  if (actorRole !== "OWNER") {
    throw new AdvertiserSettingsError("FORBIDDEN", "Only the owner can submit for verification")
  }

  const advertiser = await prisma.advertiser.findUniqueOrThrow({
    where: { id: advertiserId },
    select: { verification_status: true },
  })
  if (advertiser.verification_status !== "UNVERIFIED") {
    throw new AdvertiserSettingsError(
      "ALREADY_SUBMITTED",
      advertiser.verification_status === "PENDING" ? "Verification is already under review" : "Your account is already verified",
    )
  }

  await prisma.advertiser.update({ where: { id: advertiserId }, data: { verification_status: "PENDING" } })
}
