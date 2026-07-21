import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { BusinessSettings } from "@/components/business/BusinessSettings"

export default async function BusinessSettingsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  return (
    <BusinessSettings
      companyName={advertiser.company_name}
      plan={advertiser.plan}
      verificationStatus={advertiser.verification_status}
      role={advertiser.role}
    />
  )
}
