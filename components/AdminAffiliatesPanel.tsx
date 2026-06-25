'use client'
import React, { useEffect, useState } from 'react'

type Affiliate = {
  id: number
  status?: string
  initiated_by?: string
  requested_at?: string
  reviewed_at?: string | null
  rejected_reason?: string | null
  affiliate_user: { username?: string | null; email?: string | null }
  shop_user: { username?: string | null; email?: string | null }
  active_grants: number
}

export default function AdminAffiliatesPanel() {
  const [items, setItems] = useState<Affiliate[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/affiliates')
      .then((r) => r.json())
      .then((data) => setItems(data || []))
      .catch(() => setError('Failed to load affiliates'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading affiliates…</div>

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>ID</th>
            <th style={{ textAlign: 'left' }}>Shop</th>
            <th style={{ textAlign: 'left' }}>Affiliate</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Active Grants</th>
            <th style={{ textAlign: 'left' }}>Requested</th>
            <th style={{ textAlign: 'left' }}>Reviewed</th>
          </tr>
        </thead>
        <tbody>
          {items && items.length > 0 ? (
            items.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.shop_user.username ?? a.shop_user.email ?? 'Unknown'}</td>
                <td>{a.affiliate_user.username ?? a.affiliate_user.email ?? 'Unknown'}</td>
                <td>{a.status}</td>
                <td>{a.active_grants}</td>
                <td>{a.requested_at ? new Date(a.requested_at).toLocaleString() : '-'}</td>
                <td>{a.reviewed_at ? new Date(a.reviewed_at).toLocaleString() : '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>No affiliate relationships found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
