import { buildWorldMap } from "@/lib/services/geo-map"
import { WorldMap } from "@/components/WorldMap"

type CountryCount = {
  code: string
  count: number
}

type Props = {
  countries: CountryCount[]
  totalUsers: number
}

export default function AdminGeoMap({ countries, totalUsers }: Props) {
  const map = buildWorldMap(countries)

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-medium">User geography</h2>
      <p className="text-xs text-muted-foreground mt-1">
        Users grouped by country, detected automatically from IP at signup.
      </p>

      <div className="grid md:grid-cols-[3fr_2fr] gap-6 mt-4">
        <WorldMap features={map.features} width={map.width} height={map.height} />

        <div>
          <p className="text-xs text-muted-foreground">Total users</p>
          <p className="text-xl font-semibold tracking-tight mt-1">{totalUsers.toLocaleString()}</p>
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No data yet.</p>
          ) : (
            <ul className="space-y-2 mt-4">
              {countries.slice(0, 8).map((country) => (
                <li key={country.code} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{country.code}</span>
                  <span className="font-mono font-medium">{country.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
