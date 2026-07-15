"use client"

import { useState } from "react"
import { NO_DATA_FILL, NO_DATA_STROKE, RAMP, type MapFeature } from "@/lib/services/geo-map"

export function WorldMap({ features, width, height }: { features: MapFeature[]; width: number; height: number }) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const hovered = features.find((f) => f.id === hoverId) ?? null

  const clearHover = (id: string) => setHoverId((current) => (current === id ? null : current))

  return (
    <div>
      <div className="h-5 mb-2 text-sm">
        {hovered ? (
          <>
            <span className="font-mono font-medium">{hovered.count.toLocaleString()}</span>
            <span className="text-muted-foreground"> {hovered.count === 1 ? "user" : "users"} — </span>
            <span className="text-muted-foreground">{hovered.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Hover a country for detail</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="World map of users by country"
      >
        {features.map((f) => {
          if (!f.path) return null
          const isHover = f.id === hoverId
          const fill = f.bucket === 0 ? NO_DATA_FILL : RAMP[f.bucket - 1]
          return (
            <path
              key={f.id}
              d={f.path}
              fill={fill}
              stroke={isHover ? "#111827" : NO_DATA_STROKE}
              strokeWidth={isHover ? 1.25 : 0.5}
              tabIndex={f.count > 0 ? 0 : -1}
              role={f.count > 0 ? "button" : undefined}
              aria-label={f.count > 0 ? `${f.name}: ${f.count.toLocaleString()} users` : undefined}
              onMouseEnter={() => setHoverId(f.id)}
              onMouseLeave={() => clearHover(f.id)}
              onFocus={() => setHoverId(f.id)}
              onBlur={() => clearHover(f.id)}
              className="outline-none transition-[stroke,stroke-width] duration-150"
              style={{ cursor: f.count > 0 ? "pointer" : "default" }}
            />
          )
        })}
      </svg>

      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
        <span>No data</span>
        <Swatch color={NO_DATA_FILL} />
        <span className="mx-1">·</span>
        <span>Fewer users</span>
        {RAMP.map((color) => (
          <Swatch key={color} color={color} />
        ))}
        <span>More users</span>
      </div>
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return <span className="inline-block w-3 h-3 rounded-sm border border-border/50" style={{ backgroundColor: color }} />
}
