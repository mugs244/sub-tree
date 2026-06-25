import AdminUsersTable from "@/components/AdminUsersTable"

export const metadata = { title: "Users — Admin" }

export default function AdminUsersPage() {
  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search, view, and manage platform accounts.
        </p>
      </div>
      <AdminUsersTable />
    </div>
  )
}
