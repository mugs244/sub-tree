import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import AdminAffiliatesPanel from '../../../components/AdminAffiliatesPanel'

export default async function AdminAffiliatesPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  return (
    <div style={{ padding: 24 }}>
      <h1>Affiliates</h1>
      <p>Review affiliate relationships and inspect referral attribution.</p>
      <AdminAffiliatesPanel />
    </div>
  )
}
