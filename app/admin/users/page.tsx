import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import AdminUsersTable from '../../../components/AdminUsersTable'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  return (
    <div style={{ padding: 24 }}>
      <h1>Users</h1>
      <p>Manage platform users: search, view, and change account status.</p>
      <AdminUsersTable />
    </div>
  )
}
