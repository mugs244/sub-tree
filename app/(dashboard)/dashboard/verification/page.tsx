import { getSession } from "@/lib/auth/session"
import { getVerificationState } from "@/lib/services/verification"
import { getRefundMeter } from "@/lib/services/billing"
import { VerificationFlow } from "@/components/dashboard/VerificationFlow"
import { RefundMeterCard } from "@/components/dashboard/RefundMeterCard"

export const metadata = { title: "Verification" }

// Reached from Settings → Verification badge.
export default async function VerificationPage() {
  const session = await getSession()
  const [state, refund] = await Promise.all([getVerificationState(session!.userId), getRefundMeter(session!.userId)])
  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 pb-6 pt-2 md:px-8 md:py-8">
      <h1 className="hidden text-3xl font-bold tracking-tight md:block">Verification</h1>
      <VerificationFlow initial={state} />
      {refund && <RefundMeterCard meter={refund} />}
    </div>
  )
}
