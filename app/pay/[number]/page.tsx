import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { getInvoiceForUser, PLANS, type Plan } from "@/lib/services/billing"
import { getClientBalance } from "@/lib/services/client-wallet"
import { SubPay } from "@/components/subpay/SubPay"

export const metadata = { title: "Sub-pay" }
type Props = { params: Promise<{ number: string }> }

// Sub-pay: sub-tree.com/pay/INV-000123. Every "Pay now" (emails, portal
// notifications) lands here. Only the invoice's owner can open it.
export default async function SubPayPage({ params }: Props) {
  const { number } = await params
  const session = await getSession()
  if (!session) redirect(`/sign-in?next=/pay/${encodeURIComponent(number)}`)

  const invoice = await getInvoiceForUser(session.userId, number)
  if (!invoice) notFound()

  const [balance, sub, user] = await Promise.all([
    getClientBalance(session.userId),
    prisma.verificationSubscription.findUnique({ where: { user_id: session.userId } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { verified_at: true } }),
  ])
  const plan = PLANS[invoice.plan as Plan]

  return (
    <Suspense>
      <SubPay
        invoice={{
          number: number.toUpperCase(),
          status: invoice.status,
          title: "Sub-tree verified badge",
          planLabel: `${plan.label} plan · ${plan.months === 12 ? "per year" : "per month"}`,
          amount: invoice.amount,
          dueAt: invoice.due_at.toISOString(),
          paidAt: invoice.paid_at?.toISOString() ?? null,
          method: invoice.payment_method,
        }}
        walletBalance={Math.max(0, Math.floor(balance.available))}
        autoRenewWallet={sub?.auto_renew_wallet ?? false}
        next={user?.verified_at
          ? { href: "/dashboard/settings", label: "Back to settings" }
          : { href: "/dashboard/verification", label: "Continue to ID check" }}
      />
    </Suspense>
  )
}
