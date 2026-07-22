import { AdvertiserPlan } from "@prisma/client"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { sendVerificationEmail, verifyCode } from "@/lib/auth/email"
import { sendPhoneVerificationCode, verifyPhoneCode } from "@/lib/services/phone-verification"
import { getAdvertiserPlanFee, initiateAdvertiserPayment } from "@/lib/services/advertiser-payment"

export class OnboardingError extends Error {
  constructor(
    public readonly code: "EMAIL_TAKEN" | "INVALID" | "BAD_CODE" | "NOT_FOUND",
    message: string,
  ) {
    super(message)
    this.name = "OnboardingError"
  }
}

const PLANS = new Set(Object.values(AdvertiserPlan))

// Standalone company signup — the company email/phone are the login. Creates
// the User (ADVERTISER), the Advertiser org (UNVERIFIED for now), and the OWNER
// membership together, then fires the email + phone verification codes. The
// account exists but stays UNVERIFIED until all onboarding data is in (see
// maybeGrantVerification).
export async function signupAdvertiser(input: {
  companyName: string
  email: string
  password: string
  phone: string
  tin: string
  plan: string
}): Promise<{ userId: number; advertiserId: number }> {
  const companyName = input.companyName?.trim()
  const email = input.email?.trim().toLowerCase()
  const phone = input.phone?.replace(/\s/g, "")
  const tin = input.tin?.trim()

  if (!companyName || companyName.length < 2) throw new OnboardingError("INVALID", "Company name is required")
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OnboardingError("INVALID", "A valid email is required")
  if (!input.password || input.password.length < 8) throw new OnboardingError("INVALID", "Password must be at least 8 characters")
  if (!phone || !/^0[0-9]{9}$/.test(phone)) throw new OnboardingError("INVALID", "A valid Ugandan phone number is required")
  if (!tin) throw new OnboardingError("INVALID", "TIN is required")
  if (!PLANS.has(input.plan as AdvertiserPlan)) throw new OnboardingError("INVALID", "Choose a plan")

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) throw new OnboardingError("EMAIL_TAKEN", "An account with this email already exists")

  const password_hash = await hashPassword(input.password)

  const { userId, advertiserId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password_hash, phone, account_type: "ADVERTISER" },
      select: { id: true },
    })
    const advertiser = await tx.advertiser.create({
      data: { company_name: companyName, tin, phone, plan: input.plan as AdvertiserPlan },
      select: { id: true },
    })
    await tx.advertiserMember.create({
      data: { advertiser_id: advertiser.id, user_id: user.id, role: "OWNER", joined_at: new Date() },
    })
    return { userId: user.id, advertiserId: advertiser.id }
  })

  // Best-effort — a failed send shouldn't roll back the account; the user can resend.
  await sendVerificationEmail(userId, email).catch((err) => console.error("onboarding email send failed", err))
  await sendPhoneVerificationCode(userId, phone).catch((err) => console.error("onboarding sms send failed", err))

  return { userId, advertiserId }
}

export async function resendOnboardingCodes(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } })
  if (!user?.email) throw new OnboardingError("NOT_FOUND", "Account not found")
  await sendVerificationEmail(userId, user.email).catch((err) => console.error("resend email failed", err))
  if (user.phone) await sendPhoneVerificationCode(userId, user.phone).catch((err) => console.error("resend sms failed", err))
}

export async function verifyOnboardingEmail(userId: number, advertiserId: number, code: string): Promise<{ verified: boolean }> {
  const ok = await verifyCode(userId, code) // marks user.email_verified_at
  if (!ok) throw new OnboardingError("BAD_CODE", "Invalid or expired code")
  const verified = await maybeGrantVerification(advertiserId)
  return { verified }
}

export async function verifyOnboardingPhone(userId: number, advertiserId: number, code: string): Promise<{ verified: boolean }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } })
  if (!user?.phone) throw new OnboardingError("NOT_FOUND", "No phone on file")
  const ok = await verifyPhoneCode(userId, user.phone, code)
  if (!ok) throw new OnboardingError("BAD_CODE", "Invalid or expired code")
  await prisma.user.update({ where: { id: userId }, data: { phone_verified_at: new Date() } })
  const verified = await maybeGrantVerification(advertiserId)
  return { verified }
}

export async function setOnboardingLogo(advertiserId: number, logoUrl: string): Promise<{ verified: boolean }> {
  if (!logoUrl?.trim()) throw new OnboardingError("INVALID", "A logo URL is required")
  await prisma.advertiser.update({ where: { id: advertiserId }, data: { logo_url: logoUrl.trim() } })
  const verified = await maybeGrantVerification(advertiserId)
  return { verified }
}

// The badge is granted the moment all required data is present — verified email,
// verified phone, TIN, and logo — with no separate admin review. Idempotent.
export async function maybeGrantVerification(advertiserId: number): Promise<boolean> {
  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    select: {
      verification_status: true,
      tin: true,
      logo_url: true,
      members: {
        where: { role: "OWNER" },
        select: { user: { select: { email_verified_at: true, phone_verified_at: true } } },
      },
    },
  })
  if (!advertiser) throw new OnboardingError("NOT_FOUND", "Business account not found")
  if (advertiser.verification_status === "VERIFIED") return true

  const owner = advertiser.members[0]?.user
  const complete = !!(
    owner?.email_verified_at &&
    owner?.phone_verified_at &&
    advertiser.tin &&
    advertiser.logo_url
  )
  if (!complete) return false

  await prisma.advertiser.update({ where: { id: advertiserId }, data: { verification_status: "VERIFIED" } })
  return true
}

// Kick off the subscription payment (Pesapal) for the advertiser's plan fee.
// Returns the hosted-checkout redirect; the welcome lands on payment success.
export async function payOnboardingSubscription(advertiserId: number, phone?: string): Promise<{ redirectUrl: string; paymentId: number }> {
  const advertiser = await prisma.advertiser.findUniqueOrThrow({ where: { id: advertiserId }, select: { plan: true } })
  const fee = await getAdvertiserPlanFee(advertiser.plan)
  return initiateAdvertiserPayment({ advertiserId, kind: "SUBSCRIPTION", amountUgx: fee, phone })
}
