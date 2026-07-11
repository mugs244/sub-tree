'use client'

type CountryCount = {
  code: string
  count: number
}

type Props = {
  countries: CountryCount[]
  totalUsers: number
}

export default function AdminGeoMap({ countries, totalUsers }: Props) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 24, minHeight: 360 }}>
      <h2>User Geography Map</h2>
      <p style={{ color: '#666', marginTop: 4 }}>
        Users are grouped by country, detected automatically from IP at signup.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div style={{ minHeight: 260, background: '#f8f8f8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span>World map placeholder</span>
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>Total users</p>
          <p style={{ margin: '8px 0 16px', fontSize: '1.25rem' }}>{totalUsers}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {countries.slice(0, 8).map((country) => (
              <div key={country.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#fff', borderRadius: 10, border: '1px solid #eee' }}>
                <span>{country.code}</span>
                <span>{country.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
