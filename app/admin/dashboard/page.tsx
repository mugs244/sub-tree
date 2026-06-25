import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <p>Quick links to admin sections:</p>
      <ul>
        <li><Link href="/admin/users">Users</Link></li>
        <li><Link href="/admin/affiliates">Affiliates</Link></li>
        <li><Link href="/admin/tiers">Membership Tiers</Link></li>
        <li><Link href="/admin/analytics">Analytics / Geography</Link></li>
        <li><Link href="/admin/content-house">Content House</Link></li>
        <li><Link href="/admin/orders">Orders</Link></li>
        <li><Link href="/admin/settings">Settings</Link></li>
      </ul>
    </div>
  )
}
