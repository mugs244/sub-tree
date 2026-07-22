import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { OnboardingFlow } from "@/components/business/OnboardingFlow"

export const metadata = { title: "Sub-tree for business" }

// Public standalone company signup. If the visitor is already an advertiser,
// send them to their dashboard instead of re-onboarding.
export default async function BusinessSignupPage() {
  const session = await getSession()
  if (session) {
    const advertiser = await getAdvertiserForUser(session.userId)
    if (advertiser) redirect("/business/ad-slots")
  }
  return <OnboardingFlow />
}
