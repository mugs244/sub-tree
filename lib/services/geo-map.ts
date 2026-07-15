// Builds SVG path data for a world choropleth from real country boundaries
// (world-atlas, Natural Earth 110m — small enough to bundle, no CDN fetch).
// Stored country_code values are ISO 3166-1 alpha-2 (from Vercel's
// x-vercel-ip-country header); world-atlas's topology keys features by ISO
// 3166-1 *numeric* id, so i18n-iso-countries bridges the two.

import { geoNaturalEarth1, geoPath } from "d3-geo"
import { feature } from "topojson-client"
import type { FeatureCollection, Geometry } from "geojson"
import type { Topology } from "topojson-specification"
import countriesTopology from "world-atlas/countries-110m.json"
import iso from "i18n-iso-countries"

const WIDTH = 960
const HEIGHT = 500

// Fixed 5-step near-black ramp (validated: lightness monotone, adjacent
// steps >=0.06 L apart, light end clears 2:1 contrast on white) — see
// dataviz skill's ordinal-ramp check. Bucket 0 (no users yet) is a separate
// neutral fill, not part of the ramp.
export const NO_DATA_FILL = "#f3f4f6"
export const NO_DATA_STROKE = "#e5e7eb"
export const RAMP = ["#9ca3af", "#6b7280", "#4b5563", "#374151", "#111827"]

export interface MapFeature {
  id: string
  name: string
  path: string
  count: number
  /** 0 = no data, 1-5 = index into RAMP (1-indexed) */
  bucket: number
}

export interface WorldMapData {
  features: MapFeature[]
  width: number
  height: number
}

function bucketFor(count: number, min: number, max: number): number {
  if (max === min) return RAMP.length
  const t = (count - min) / (max - min)
  return Math.min(RAMP.length, Math.max(1, Math.round(t * (RAMP.length - 1)) + 1))
}

export function buildWorldMap(countries: { code: string; count: number }[]): WorldMapData {
  const topology = countriesTopology as unknown as Topology
  const geo = feature(topology, topology.objects.countries!) as unknown as FeatureCollection<Geometry>

  const countByNumeric = new Map<string, number>()
  for (const c of countries) {
    const numeric = iso.alpha2ToNumeric(c.code)
    if (numeric) countByNumeric.set(numeric, c.count)
  }

  const counts = [...countByNumeric.values()]
  const max = counts.length ? Math.max(...counts) : 0
  const min = counts.length ? Math.min(...counts) : 0

  const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], geo)
  const pathGen = geoPath(projection)

  const features: MapFeature[] = geo.features.map((f) => {
    const id = String(f.id ?? "")
    const count = countByNumeric.get(id) ?? 0
    return {
      id,
      name: (f.properties as { name?: string } | null)?.name ?? "Unknown",
      path: pathGen(f) ?? "",
      count,
      bucket: count === 0 ? 0 : bucketFor(count, min, max),
    }
  })

  return { features, width: WIDTH, height: HEIGHT }
}
