import { randomUUID } from "node:crypto"
import { sendEmail } from "@/lib/email/send"
import { prisma } from "@/lib/db"
import { createNotification } from "@/lib/services/notification"
import { sendVerificationCode, verifyWithdrawalOtp } from "@/lib/services/withdrawal-otp"
import { isSmileConfigured, mintSmileToken, type SmileSession } from "@/lib/services/smile-id"
import { emailLayout, heading, greeting, p, notice, button } from "@/lib/email/template"
import { isBadgeLive, isSubscriptionPaid } from "@/lib/services/billing"
import { isAdmin } from "@/lib/services/admin"
import { isBadgeStyle, type BadgeStyle } from "@/components/VerifiedBadge"
import { saveReviewImages, deleteReviewImages, type ImageKind } from "@/lib/services/verification-images"

// The verification badge. Flow:
//   start()        → email code to the account email
//   openSession()  → code checked, attempt created, Smile ID token minted
//   markSubmitted()→ the Smile ID widget sent the images
//   handleResult() → Smile ID webhook: clear → badge; attention → admin
//                    review; block → not approved; error → try again
//   adminDecide()  → admin approves/rejects an attention case
// Smile ID checks cost money, so each account gets MAX_ATTEMPTS tries
// (an "error" result, where Smile ID couldn't process it, doesn't count).

export const MAX_ATTEMPTS = 3
const COUNTED = ["SUBMITTED", "APPROVED", "IN_REVIEW", "REJECTED"]

export class VerificationError extends Error {
  constructor(
    public readonly code: "NOT_CONFIGURED" | "NOT_PAID" | "ALREADY_VERIFIED" | "IN_PROGRESS" | "NO_ATTEMPTS" | "NOT_FOUND",
    message: string,
  ) {
    super(message)
    this.name = "VerificationError"
  }
}

export type VerificationStage = "none" | "submitted" | "in_review" | "verified" | "rejected"

export interface VerificationState {
  configured: boolean
  /** Admin testing before Smile ID is connected: Sub-pay works, the ID check doesn't yet. */
  testMode: boolean
  /** Subscription paid up to now (required before the ID check). */
  paid: boolean
  /** Badge currently visible (verified + subscription within grace). */
  badgeLive: boolean
  periodEnd: string | null
  autoRenewWallet: boolean
  cardRecurring: boolean
  plan: string | null
  stage: VerificationStage
  verifiedAt: string | null
  attemptsLeft: number
  badgeStyle: BadgeStyle
}

export async function getVerificationState(userId: number): Promise<VerificationState> {
  const [user, latest, used, sub] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { verified_at: true, badge_style: true } }),
    prisma.verificationRequest.findFirst({
      where: { user_id: userId, status: { in: COUNTED } },
      orderBy: { created_at: "desc" },
      select: { status: true },
    }),
    prisma.verificationRequest.count({ where: { user_id: userId, status: { in: COUNTED } } }),
    prisma.verificationSubscription.findUnique({ where: { user_id: userId } }),
  ])
  const stage: VerificationStage = user?.verified_at
    ? "verified"
    : latest?.status === "SUBMITTED" ? "submitted"
    : latest?.status === "IN_REVIEW" ? "in_review"
    : latest?.status === "REJECTED" ? "rejected"
    : "none"
  return {
    configured: isSmileConfigured(),
    testMode: !isSmileConfigured() && isAdmin(userId),
    paid: isSubscriptionPaid(sub),
    badgeLive: isBadgeLive(user?.verified_at ?? null, sub),
    periodEnd: sub?.current_period_end.toISOString() ?? null,
    autoRenewWallet: sub?.auto_renew_wallet ?? false,
    cardRecurring: sub?.card_recurring ?? false,
    plan: sub?.plan ?? null,
    stage,
    verifiedAt: user?.verified_at?.toISOString() ?? null,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - used),
    badgeStyle: isBadgeStyle(user?.badge_style) ? user.badge_style : "classic",
  }
}

// Classic (blue tick) or tree — can be changed any time, before or after verifying.
export async function setBadgeStyle(userId: number, style: BadgeStyle): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { badge_style: style } })
}

async function assertCanApply(userId: number): Promise<void> {
  if (!isSmileConfigured()) throw new VerificationError("NOT_CONFIGURED", "Verification is coming soon")
  const state = await getVerificationState(userId)
  if (state.stage === "verified") throw new VerificationError("ALREADY_VERIFIED", "Your account is already verified")
  // Pay first: the subscription covers the (paid) Smile ID check.
  if (!state.paid) throw new VerificationError("NOT_PAID", "Choose a plan and pay first")
  if (state.stage === "submitted" || state.stage === "in_review") {
    throw new VerificationError("IN_PROGRESS", "Your application is already being checked")
  }
  if (state.attemptsLeft <= 0) {
    throw new VerificationError("NO_ATTEMPTS", "You've used all your verification attempts. Contact support for help.")
  }
}

export async function startVerification(userId: number): Promise<void> {
  await assertCanApply(userId)
  await sendVerificationCode(userId)
}

export async function openSession(userId: number, code: string, callbackUrl: string): Promise<SmileSession & { smileUserId: string }> {
  await assertCanApply(userId)
  await verifyWithdrawalOtp(userId, code, "VERIFICATION")

  // Abandoned earlier attempts (widget opened, never submitted) are closed.
  await prisma.verificationRequest.updateMany({
    where: { user_id: userId, status: "AWAITING_CAPTURE" },
    data: { status: "ERROR", result_summary: "Abandoned before submitting" },
  })

  const smileUserId = `st-${userId}-${randomUUID()}`
  await prisma.verificationRequest.create({ data: { user_id: userId, smile_user_id: smileUserId } })
  const session = await mintSmileToken(smileUserId, callbackUrl)
  return { ...session, smileUserId }
}

// The widget reported a successful upload (no verdict yet).
export async function markSubmitted(userId: number, smileUserId: string, jobId: string | null): Promise<void> {
  const updated = await prisma.verificationRequest.updateMany({
    where: { user_id: userId, smile_user_id: smileUserId, status: "AWAITING_CAPTURE" },
    data: { status: "SUBMITTED", submitted_at: new Date(), ...(jobId ? { smile_job_id: jobId } : {}) },
  })
  if (updated.count === 0) throw new VerificationError("NOT_FOUND", "Verification attempt not found")
}

// ── Smile ID result ────────────────────────────────────────────────────────

export interface SmileResult {
  smileUserId: string
  jobId: string | null
  status: string // clear | attention | block | error
  summary: string | null
  idFullName: string | null
  /** Smile ID's 15-minute signed image links — saved only for reviews. */
  imageLinks?: Partial<Record<ImageKind, string>>
}

// Called by the webhook once its signature has been checked. Idempotent:
// results for unknown or already-decided attempts are ignored.
export async function handleSmileResult(r: SmileResult): Promise<void> {
  const req = await prisma.verificationRequest.findUnique({ where: { smile_user_id: r.smileUserId } })
  if (!req || !["AWAITING_CAPTURE", "SUBMITTED"].includes(req.status)) return

  const status = r.status.toLowerCase()
  const next = status === "clear" ? "APPROVED" : status === "attention" ? "IN_REVIEW" : status === "block" ? "REJECTED" : "ERROR"

  await prisma.verificationRequest.update({
    where: { id: req.id },
    data: {
      status: next,
      smile_result: status,
      result_summary: r.summary,
      id_full_name: r.idFullName,
      ...(r.jobId ? { smile_job_id: r.jobId } : {}),
      submitted_at: req.submitted_at ?? new Date(),
    },
  })

  if (next === "APPROVED") await grantBadge(req.user_id, r.idFullName)
  else if (next === "IN_REVIEW") {
    // Keep the photos only for this review; deleted when an admin decides.
    if (r.imageLinks) await saveReviewImages(req.id, r.imageLinks)
    await emailInReview(req.user_id)
  }
  else if (next === "REJECTED") await emailRejected(req.user_id)
  else await emailTryAgain(req.user_id)
}

export async function adminDecide(requestId: number, approve: boolean, adminId: number): Promise<void> {
  const req = await prisma.verificationRequest.findUnique({ where: { id: requestId } })
  if (!req || req.status !== "IN_REVIEW") throw new VerificationError("NOT_FOUND", "Request not found or already decided")
  await prisma.verificationRequest.update({
    where: { id: requestId },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewed_by: adminId, reviewed_at: new Date() },
  })
  await deleteReviewImages(requestId)
  if (approve) await grantBadge(req.user_id, req.id_full_name)
  else await emailRejected(req.user_id)
}

export async function listVerificationReviews() {
  return prisma.verificationRequest.findMany({
    where: { status: "IN_REVIEW" },
    orderBy: { submitted_at: "asc" },
    select: {
      id: true, user_id: true, smile_job_id: true, smile_result: true, result_summary: true, id_full_name: true, submitted_at: true,
      user: { select: { username: true, email: true, profile: { select: { display_name: true } } } },
    },
  })
}

// ── Outcomes ──────────────────────────────────────────────────────────────

async function contact(userId: number) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, profile: { select: { display_name: true } } },
  })
  return { email: u?.email ?? null, username: u?.username ?? "", name: u?.profile?.display_name ?? u?.username ?? "there" }
}

async function send(userId: number, subject: string, preheader: string, body: string): Promise<void> {
  const { email } = await contact(userId)
  if (!email) return
  await sendEmail({ to: email, subject, html: emailLayout({ preheader, body }) })
}

async function grantBadge(userId: number, idFullName: string | null): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { verified_at: new Date(), ...(idFullName ? { verified_name: idFullName } : {}) },
  })
  await createNotification({
    userId,
    type: "ANNOUNCEMENT",
    title: "You're verified",
    body: "Your verified badge is now showing on your Sub-tree page.",
  })
  await emailVerified(userId)
}

// The verification emails are exported for the admin email tester.
export async function emailVerified(userId: number): Promise<void> {
  const { name, username } = await contact(userId)
  await send(
    userId,
    "You're verified on Sub-tree",
    "Your verified badge is now live on your page.",
    heading("You're verified") +
      greeting(name) +
      p("Your identity check went through. Your verified badge is now showing on your Sub-tree page, so supporters know a real, ID-checked person runs it.") +
      button("See your page", `https://sub-tree.com/${username}`) +
      notice("Your ID photos and face scan were checked by our verification partner, Smile ID. Sub-tree doesn't keep copies of them.", "success"),
  )
}

export async function emailInReview(userId: number): Promise<void> {
  const { name } = await contact(userId)
  await send(
    userId,
    "Your verification is being reviewed",
    "A person on our team is taking a closer look.",
    heading("Almost there") +
      greeting(name) +
      p("Your verification needs a quick look from a person on our team — this happens with things like blurry photos or an ID close to expiry. We'll email you as soon as it's decided, usually within 1–2 business days.") +
      notice("You don't need to do anything right now."),
  )
}

export async function emailRejected(userId: number): Promise<void> {
  const { name } = await contact(userId)
  const { attemptsLeft } = await getVerificationState(userId)
  await send(
    userId,
    "We couldn't verify your account",
    attemptsLeft > 0 ? `You can try again — ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left.` : "Reply to this email if you need help.",
    heading("We couldn't verify you") +
      greeting(name) +
      p("We weren't able to confirm your identity from this attempt. The most common reasons are photos that are blurry, cut off or have glare, an expired ID, or a face scan that didn't match the ID photo.") +
      (attemptsLeft > 0
        ? notice(`You have ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left. Use your original national ID in good light, with all four corners showing.`) +
          button("Try again", "https://sub-tree.com/dashboard/verification")
        : notice("You've used all your attempts. Reply to this email and our team will help you.", "danger")),
  )
}

export async function emailTryAgain(userId: number): Promise<void> {
  const { name } = await contact(userId)
  await send(
    userId,
    "Please try your verification again",
    "Something went wrong on our partner's side — this one doesn't count.",
    heading("Let's try that again") +
      greeting(name) +
      p("Our verification partner couldn't process your photos this time. This attempt doesn't count towards your limit.") +
      button("Try again", "https://sub-tree.com/dashboard/verification"),
  )
}
