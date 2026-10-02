// The Sub-tree tree: a rounded arrowhead on top, two stacked branches and a
// trunk. One drawing shared by the logo, the site icons and the verified
// badge. Drawn in a 24×24 box, centred on (12, 11.5); use TREE_VIEWBOX to
// frame just the tree.

export const TREE_VIEWBOX = "2.5 2 19 19"

const PATHS = [
  { d: "M12 5.3 L10 7.9 L12 7.05 L14 7.9 Z", w: 1.25, filled: true },
  { d: "M9.2 11.3 L12 9.15 L14.8 11.3", w: 1.45 },
  { d: "M8.6 14.2 L12 11.65 L15.4 14.2", w: 1.45 },
  { d: "M12 14.75 V17.7", w: 1.45 },
]

export function TreeGlyph({ color = "currentColor" }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {PATHS.map((p) => (
        <path key={p.d} d={p.d} fill={p.filled ? color : "none"} strokeWidth={p.w} />
      ))}
    </g>
  )
}

// The tree as a standalone SVG data URI, for next/og image routes (Satori
// can't render a React component nested inside an <svg>, but takes an <img>).
export function treeSvgDataUri(color: string): string {
  const paths = PATHS.map(
    (p) => `<path d="${p.d}" fill="${p.filled ? color : "none"}" stroke="${color}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${TREE_VIEWBOX}">${paths}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}
