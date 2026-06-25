'use client'
import React, { useEffect, useState } from 'react'

type User = {
  id: string
  username?: string
  display_name?: string | null
  email?: string | null
  phone?: string | null
  account_type?: string
  tier?: string
  country_code?: string | null
  last_active_at?: string | null
  suspended?: boolean
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => setUsers(data || []))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleSuspend(id: string, suspend: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suspend ? 'suspend' : 'reactivate' }),
      })
      if (!res.ok) throw new Error('Request failed')
      setUsers((prev) =>
        prev?.map((user) =>
          user.id === id ? { ...user, suspended: suspend } : user,
        ) ?? prev,
      )
    } catch {
      setError('Unable to update user status')
    }
  }

  if (loading) return <div>Loading users…</div>

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>ID</th>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th style={{ textAlign: 'left' }}>Email</th>
            <th style={{ textAlign: 'left' }}>Country</th>
            <th style={{ textAlign: 'left' }}>Tier</th>
            <th style={{ textAlign: 'left' }}>Last Active</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users && users.length > 0 ? (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.display_name ?? u.username ?? '-'}</td>
                <td>{u.email ?? '-'}</td>
                <td>{u.country_code ?? 'Unknown'}</td>
                <td>{u.tier ?? '-'}</td>
                <td>{u.last_active_at ? new Date(u.last_active_at).toLocaleString() : 'Never'}</td>
                <td>{u.suspended ? 'Suspended' : 'Active'}</td>
                <td>
                  <button style={{ marginRight: 8 }} onClick={() => alert('View user ' + u.id)}>
                    View
                  </button>
                  <button onClick={() => toggleSuspend(u.id, !u.suspended)}>
                    {u.suspended ? 'Reactivate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8}>No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
