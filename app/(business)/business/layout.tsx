import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { BusinessDashboardLayout } from "@/components/layouts/BusinessDashboardLayout"

export default async function BusinessRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  return (
    <BusinessDashboardLayout companyName={advertiser.company_name} verified={advertiser.verification_status === "VERIFIED"}>
      {children}
    </BusinessDashboardLayout>
  )
}
