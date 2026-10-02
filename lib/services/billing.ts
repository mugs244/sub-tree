import { randomUUID } from "node:crypto"
import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { submitOrder, getTransactionStatus } from "@/lib/services/payments/pesapal"
import { getClientBalance } from "@/lib/services/client-wallet"
import { createNotification } from "@/lib/services/notification"
import type { MomoCallbackPayload } from "@/lib/services/momo/types"
import { emailLayout, heading, greeting, p, button, amountCard, details, notice } from "@/lib/email/template"

// Sub-pay: invoices for paid Sub-tree features, starting with the
// verification badge subscription. Every bill is an Invoice, paid on
// sub-tree.com/pay/<INV-000123> by card or mobile money (Pesapal's checkout,
// embedded) or from the creator's Sub-tree wallet.
//
// Renewal: cards can auto-renew through Pesapal's recurring option (Pesapal
// charges and sends a RECURRING IPN); wallets can auto-renew through the
// daily cron (runVerificationBilling); mobile money is always a one-time
// payment, so reminder emails carry a Pay now link.

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <hello@sub-tree.com>"
const SITE = "https://sub-tree.com"
const DAY = 86_400_000
export const GRACE_DAYS = 3

export type Plan = "MONTHLY" | "ANNUAL"
export const PLANS: Record<Plan, { label: string; amount: number; months: number; per: string }> = {
  MONTHLY: { label: "Monthly", amount: 10_000, months: 1, per: "month" },
  ANNUAL: { label: "Annual", amount: 100_000, months: 12, per: "year" },
}

export class BillingError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "ALREADY_PAID" | "INSUFFICIENT_BALANCE" | "PAYMENT_ERROR",
    message: string,
  ) {
    super(message)
    this.name = "BillingError"
  }
}

const fmt = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`
const date = (d: Date) => d.toLocaleDateString("en-UG", { timeZone: "Africa/Kampala", day: "numeric", month: "long", year: "numeric" })

export function invoiceNumber(id: number): string {
  return `INV-${String(id).padStart(6, "0")}`
}
export function parseInvoiceNumber(n: string): number | null {
  const m = /^INV-(\d+)$/i.exec(n.trim())
  return m ? Number(m[1]) : null
}
export const payUrl = (id: number) => `${SITE}/pay/${invoiceNumber(id)}`

function addMonths(d: Date, months: number): Date {
  const out = new Date(d)
  out.setMonth(out.getMonth() + months)
  return out
}

// Badge shows while verified AND the subscription hasn't passed its grace.
export function isBadgeLive(verifiedAt: Date | null, sub: { current_period_end: Date } | null): boolean {
  return Boolean(verifiedAt && sub && sub.current_period_end.getTime() + GRACE_DAYS * DAY >= Date.now())
}

export function isSubscriptionPaid(sub: { current_period_end: Date } | null): boolean {
  return Boolean(sub && sub.current_period_end.getTime() >= Date.now())
}

export async function getBillingState(userId: number) {
  const [sub, openInvoice] = await Promise.all([
    prisma.verificationSubscription.findUnique({ where: { user_id: userId } }),
    prisma.invoice.findFirst({ where: { user_id: userId, purpose: "VERIFICATION", status: "OPEN" }, orderBy: { created_at: "desc" } }),
  ])
  return { sub, openInvoice }
}

// ── Invoices ──────────────────────────────────────────────────────────────

// One open verification invoice at a time — choosing a different plan
// updates it rather than stacking bills.
export async function createVerificationInvoice(userId: number, plan: Plan, dueAt = new Date()) {
  const open = await prisma.invoice.findFirst({ where: { user_id: userId, purpose: "VERIFICATION", status: "OPEN" } })
  if (open) {
    return prisma.invoice.update({ where: { id: open.id }, data: { plan, amount: PLANS[plan].amount } })
  }
  return prisma.invoice.create({
    data: { user_id: userId, purpose: "VERIFICATION", plan, amount: PLANS[plan].amount, due_at: dueAt, merchant_reference: `SP-new-${randomUUID()}` },
  })
}

export async function getInvoiceForUser(userId: number, number: string) {
  const id = parseInvoiceNumber(number)
  if (!id) return null
  return prisma.invoice.findFirst({ where: { id, user_id: userId } })
}

// ── Paying ────────────────────────────────────────────────────────────────

// Card or mobile money through Pesapal's checkout, shown in an iframe on the
// Sub-pay page. Each attempt gets a fresh merchant reference that still
// carries the invoice id (SP-<id>-<random>), so a payment from an older,
// still-open checkout is never lost.
export async function startPesapalCheckout(userId: number, number: string, origin: string): Promise<string> {
  const invoice = await getInvoiceForUser(userId, number)
  if (!invoice) throw new BillingError("NOT_FOUND", "Invoice not found")
  if (invoice.status !== "OPEN") throw new BillingError("ALREADY_PAID", "This invoice is already paid")

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, username: true, profile: { select: { display_name: true } } },
  })
  const ref = `SP-${invoice.id}-${randomUUID().slice(0, 8)}`
  await prisma.invoice.update({ where: { id: invoice.id }, data: { merchant_reference: ref } })

  const start = new Date()
  const result = await submitOrder(
    {
      amount: invoice.amount,
      referenceId: ref,
      payerMessage: `Sub-tree verification — ${PLANS[invoice.plan as Plan].label}`,
      email: user.email,
      firstName: user.profile?.display_name ?? user.username ?? "Creator",
      // Lets the payer turn on card auto-renew inside Pesapal's checkout.
      accountNumber: `SUBPAY-VER-${userId}`,
      subscription: {
        startDate: start,
        endDate: addMonths(start, 60),
        frequency: invoice.plan === "ANNUAL" ? "YEARLY" : "MONTHLY",
      },
    },
    `${origin}/pay/${invoiceNumber(invoice.id)}/return`,
  )
  if (!result.redirectUrl) throw new BillingError("PAYMENT_ERROR", "Couldn't open the payment window. Please try again.")
  return result.redirectUrl
}

// Pay from the Sub-tree wallet. Takes the same per-user lock as withdrawals,
// so a withdrawal and a payment can't both spend the same money.
export async function payInvoiceFromWallet(userId: number, number: string): Promise<void> {
  const invoice = await getInvoiceForUser(userId, number)
  if (!invoice) throw new BillingError("NOT_FOUND", "Invoice not found")
  await payFromWallet(userId, invoice.id)
}

async function payFromWallet(userId: number, invoiceId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId})`
    const inv = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
    if (inv.status !== "OPEN") throw new BillingError("ALREADY_PAID", "This invoice is already paid")
    const { available } = await getClientBalance(userId, tx)
    if (available < inv.amount) {
      throw new BillingError("INSUFFICIENT_BALANCE", `Your wallet has ${fmt(Math.max(0, available))} — not enough for ${fmt(inv.amount)}.`)
    }
    await tx.invoice.update({ where: { id: invoiceId }, data: { status: "PAID", paid_at: new Date(), payment_method: "WALLET" } })
  })
  await applyPaidInvoice(invoiceId)
}

const methodOf = (pm?: string) => (pm && /visa|master|card/i.test(pm) ? "CARD" : "MOBILE_MONEY")

// Pesapal told us (IPN, or the checkout return page) about a payment.
// Idempotent: a tracking id is only ever applied once.
export async function handleInvoicePesapalPayment(payload: MomoCallbackPayload, notificationType: string | null): Promise<void> {
  if (payload.status !== "SUCCESSFUL" || !payload.providerTxId) return
  if (await prisma.invoice.findUnique({ where: { pesapal_tracking_id: payload.providerTxId } })) return

  const refId = /^SP-(\d+)-/.exec(payload.referenceId)?.[1]
  const invoice = refId ? await prisma.invoice.findUnique({ where: { id: Number(refId) } }) : null
  const recurring = notificationType?.toUpperCase() === "RECURRING"

  // A first payment for an open invoice.
  if (invoice && invoice.status === "OPEN" && !recurring) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paid_at: new Date(), payment_method: methodOf(payload.paymentMethod), pesapal_tracking_id: payload.providerTxId },
    })
    await applyPaidInvoice(invoice.id)
    return
  }

  // An automatic card renewal Pesapal charged on its own schedule: find the
  // creator from the account number (or the original invoice), then pay
  // their open renewal invoice — or record a new one.
  const userId = invoice?.user_id ?? Number(/^SUBPAY-VER-(\d+)$/.exec(payload.accountNumber ?? "")?.[1] ?? NaN)
  if (!Number.isInteger(userId)) return
  const sub = await prisma.verificationSubscription.findUnique({ where: { user_id: userId } })
  const plan = (sub?.plan ?? invoice?.plan ?? "MONTHLY") as Plan
  const open = await prisma.invoice.findFirst({ where: { user_id: userId, purpose: "VERIFICATION", status: "OPEN" } })
  const renewal = open ?? (await createVerificationInvoice(userId, plan))
  await prisma.invoice.update({
    where: { id: renewal.id },
    data: { status: "PAID", paid_at: new Date(), payment_method: "CARD", pesapal_tracking_id: payload.providerTxId },
  })
  await prisma.verificationSubscription.updateMany({ where: { user_id: userId }, data: { card_recurring: true } })
  await applyPaidInvoice(renewal.id)
}

// The Sub-pay return page confirms straight away instead of waiting for the IPN.
export async function confirmPesapalReturn(userId: number, number: string, orderTrackingId: string): Promise<void> {
  const invoice = await getInvoiceForUser(userId, number)
  if (!invoice || invoice.status !== "OPEN") return
  const payload = await getTransactionStatus(orderTrackingId)
  if (payload && /^SP-(\d+)-/.exec(payload.referenceId)?.[1] === String(invoice.id)) {
    await handleInvoicePesapalPayment(payload, null)
  }
}

export async function setWalletAutoRenew(userId: number, on: boolean): Promise<void> {
  await prisma.verificationSubscription.updateMany({ where: { user_id: userId }, data: { auto_renew_wallet: on } })
}

// ── Admin ─────────────────────────────────────────────────────────────────

// Record a payment taken outside Sub-pay (cash, bank transfer to the team).
// Goes through the same path as a real payment: extends the subscription and
// sends the receipt.
export async function adminMarkInvoicePaid(invoiceId: number): Promise<void> {
  const updated = await prisma.invoice.updateMany({
    where: { id: invoiceId, status: "OPEN" },
    data: { status: "PAID", paid_at: new Date(), payment_method: "MANUAL" },
  })
  if (updated.count === 0) throw new BillingError("ALREADY_PAID", "Invoice isn't open")
  await applyPaidInvoice(invoiceId)
}

export async function adminVoidInvoice(invoiceId: number): Promise<void> {
  const updated = await prisma.invoice.updateMany({ where: { id: invoiceId, status: "OPEN" }, data: { status: "VOID" } })
  if (updated.count === 0) throw new BillingError("ALREADY_PAID", "Invoice isn't open")
}

// Free months (goodwill, support fixes). Starts from the current end date,
// or today if lapsed; no invoice, no email.
export async function adminExtendSubscription(userId: number, months: number): Promise<Date> {
  const sub = await prisma.verificationSubscription.findUnique({ where: { user_id: userId } })
  const from = sub && sub.current_period_end > new Date() ? sub.current_period_end : new Date()
  const end = addMonths(from, months)
  await prisma.verificationSubscription.upsert({
    where: { user_id: userId },
    create: { user_id: userId, plan: "MONTHLY", status: "ACTIVE", current_period_end: end },
    update: { status: "ACTIVE", current_period_end: end },
  })
  return end
}

// ── After payment ─────────────────────────────────────────────────────────

// Extends (or starts) the subscription by the invoice's plan, then sends the
// receipt. Renewing early adds to the current end date; after a lapse it
// starts from today.
async function applyPaidInvoice(invoiceId: number): Promise<void> {
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
  const plan = inv.plan as Plan
  const sub = await prisma.verificationSubscription.findUnique({ where: { user_id: inv.user_id } })
  const from = sub && sub.current_period_end > new Date() ? sub.current_period_end : new Date()
  const end = addMonths(from, PLANS[plan].months)

  await prisma.verificationSubscription.upsert({
    where: { user_id: inv.user_id },
    create: { user_id: inv.user_id, plan, status: "ACTIVE", current_period_end: end },
    update: { plan, status: "ACTIVE", current_period_end: end },
  })

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: inv.user_id },
    select: { email: true, username: true, verified_at: true, profile: { select: { display_name: true } } },
  })
  const firstTime = !user.verified_at
  await createNotification({
    userId: inv.user_id,
    type: "ANNOUNCEMENT",
    title: firstTime ? "Payment received — next, verify your ID" : "Verification renewed",
    body: firstTime
      ? `Thanks for paying ${fmt(inv.amount)}. Continue to the ID check to get your badge.`
      : `Your verified badge is active until ${date(end)}.`,
    metadata: { href: firstTime ? "/dashboard/verification" : "/dashboard/settings" },
  })

  const methodLabel =
    inv.payment_method === "WALLET" ? "Sub-tree wallet"
    : inv.payment_method === "CARD" ? "Card"
    : inv.payment_method === "MANUAL" ? "Recorded by Sub-tree"
    : "Mobile money"
  await send(
    user.email,
    `Receipt ${invoiceNumber(inv.id)} — ${fmt(inv.amount)} paid`,
    `Paid ${fmt(inv.amount)} for your Sub-tree verification.`,
    heading("Payment received") +
      greeting(user.profile?.display_name ?? user.username ?? "there") +
      amountCard("Paid", fmt(inv.amount), `${PLANS[plan].label} verification · ${methodLabel}`) +
      details([
        ["Invoice", invoiceNumber(inv.id)],
        ["Paid on", date(inv.paid_at ?? new Date())],
        ["Plan", `${PLANS[plan].label} — ${fmt(PLANS[plan].amount)}/${PLANS[plan].per}`],
        ["Active until", date(end)],
      ]) +
      (firstTime
        ? notice("Next step: complete your ID check to switch on your badge.") + button("Continue to ID check", `${SITE}/dashboard/verification`)
        : notice("Your verified badge stays on your page.", "success")),
  )
}

async function send(to: string, subject: string, preheader: string, body: string): Promise<void> {
  try {
    await resend.emails.send({ from: FROM, to, subject, html: emailLayout({ preheader, body }) })
  } catch (err) {
    console.error("Billing email failed", { to, subject, err })
  }
}

// ── Daily cron ────────────────────────────────────────────────────────────

// Runs from /api/cron/billing. Per subscription:
//   7 and 1 days before the end → renewal invoice + reminder (email + portal)
//   on the end date, if wallet auto-renew is on → charge the wallet
//   3 days after the end, still unpaid → lapsed: badge hidden, email
export async function runVerificationBilling(): Promise<{ reminded: number; renewed: number; lapsed: number }> {
  const now = Date.now()
  const subs = await prisma.verificationSubscription.findMany({
    where: { status: "ACTIVE", current_period_end: { lte: new Date(now + 8 * DAY) } },
    include: { user: { select: { email: true, username: true, profile: { select: { display_name: true } } } } },
  })
  let reminded = 0, renewed = 0, lapsed = 0

  for (const sub of subs) {
    const end = sub.current_period_end
    const left = end.getTime() - now
    const name = sub.user.profile?.display_name ?? sub.user.username ?? "there"
    const plan = sub.plan as Plan
    try {
      // Lapse after the grace period.
      if (left < -GRACE_DAYS * DAY) {
        await prisma.verificationSubscription.update({ where: { id: sub.id }, data: { status: "LAPSED", lapsed_notified_for: end } })
        const inv = await createVerificationInvoice(sub.user_id, plan)
        await createNotification({
          userId: sub.user_id, type: "ANNOUNCEMENT", title: "Your verified badge is hidden",
          body: "Your verification subscription ended. Pay to bring your badge back — no new ID check needed.",
          metadata: { href: `/pay/${invoiceNumber(inv.id)}`, action: "Pay now" },
        })
        await send(sub.user.email, "Your verified badge is now hidden", "Pay to bring it back — no new ID check needed.",
          heading("Your badge is hidden") + greeting(name) +
          p(`Your verification subscription ended on ${date(end)}, so your verified badge is no longer showing. Pay now to bring it back straight away — you won't need to do the ID check again.`) +
          button("Pay now", payUrl(inv.id)))
        lapsed++
        continue
      }

      // Wallet auto-renew on (or after) the end date.
      if (left <= 0 && sub.auto_renew_wallet) {
        const inv = await createVerificationInvoice(sub.user_id, plan)
        try {
          await payFromWallet(sub.user_id, inv.id)
          renewed++
        } catch (err) {
          if (err instanceof BillingError && err.code === "INSUFFICIENT_BALANCE" && left > -DAY) {
            await send(sub.user.email, "We couldn't renew from your wallet", "Your wallet balance is too low — pay another way.",
              heading("Wallet renewal didn't go through") + greeting(name) +
              p(`Your wallet doesn't have ${fmt(inv.amount)} for this renewal. Pay by card or mobile money to keep your badge — you have ${GRACE_DAYS} days.`) +
              button("Pay now", payUrl(inv.id)))
          }
        }
        continue
      }

      // Reminders, 7 and 1 days out.
      const due7 = left <= 7 * DAY && left > DAY && sub.reminded_7_for?.getTime() !== end.getTime()
      const due1 = left <= DAY && left > 0 && sub.reminded_1_for?.getTime() !== end.getTime()
      if (!due7 && !due1) continue

      const inv = await createVerificationInvoice(sub.user_id, plan, end)
      const how = sub.auto_renew_wallet
        ? `We'll renew it from your Sub-tree wallet on ${date(end)} — make sure it has ${fmt(inv.amount)}.`
        : sub.card_recurring
          ? `Your card will be charged automatically on ${date(end)}. Pesapal will email you before the charge.`
          : `Pay before ${date(end)} to keep your badge.`
      await createNotification({
        userId: sub.user_id, type: "ANNOUNCEMENT",
        title: due1 ? "Verification renews tomorrow" : "Verification renews in 7 days",
        body: `${fmt(inv.amount)} due ${date(end)}. ${how}`,
        metadata: { href: `/pay/${invoiceNumber(inv.id)}`, action: "Pay now" },
      })
      await send(sub.user.email, `Invoice ${invoiceNumber(inv.id)} — verification renews ${due1 ? "tomorrow" : "in 7 days"}`,
        `${fmt(inv.amount)} due ${date(end)}`,
        heading(due1 ? "Your verification renews tomorrow" : "Your verification renews soon") + greeting(name) +
        amountCard("Amount due", fmt(inv.amount), `Due ${date(end)}`) +
        details([["Invoice", invoiceNumber(inv.id)], ["Plan", `${PLANS[plan].label} verification`], ["Due", date(end)]]) +
        p(how) + button("Pay now", payUrl(inv.id)) +
        p(`If it isn't paid, your badge stays for ${GRACE_DAYS} days after the due date, then it's hidden until you pay.`, { muted: true, size: 13 }))
      await prisma.verificationSubscription.update({
        where: { id: sub.id },
        data: due1 ? { reminded_1_for: end, reminded_7_for: end } : { reminded_7_for: end },
      })
      reminded++
    } catch (err) {
      console.error("Verification billing failed for subscription", sub.id, err)
    }
  }
  return { reminded, renewed, lapsed }
}
