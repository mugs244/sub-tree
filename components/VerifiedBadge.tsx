// The verified badge shown next to a verified creator's name. Creators pick
// one of two styles when they apply (Settings → Verification can change it):
//   classic — blue scalloped badge with a white tick
//   tree    — the same badge in Sub-tree navy with the tree mark
// Pure SVG with no client code, so it renders the same in server pages,
// templates and link-preview images.

export type BadgeStyle = "classic" | "tree"
export const BADGE_STYLES: { value: BadgeStyle; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "tree", label: "Sub-tree" },
]

export function isBadgeStyle(v: unknown): v is BadgeStyle {
  return v === "classic" || v === "tree"
}

// 12-point scalloped seal, centred in a 24×24 box. The stroke in the same
// colour (round joins) softens the points like the reference artwork.
const SEAL = (() => {
  const pts: string[] = []
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 10.6 : 8.7
    const a = (Math.PI / 12) * i - Math.PI / 2
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts.join(" L")}Z`
})()

const COLORS: Record<BadgeStyle, string> = { classic: "#1DA1F2", tree: "#111827" }

export function VerifiedBadge({ size = 20, className = "", variant = "classic" }: { size?: number; className?: string; variant?: BadgeStyle }) {
  const fill = COLORS[variant] ?? COLORS.classic
  return (
    <span
      role="img"
      aria-label="Verified"
      title="Verified — this creator's identity has been checked"
      className={["inline-flex shrink-0 align-middle", className].join(" ")}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d={SEAL} fill={fill} stroke={fill} strokeWidth="1.6" strokeLinejoin="round" />
        {variant === "tree" ? <TreeGlyph /> : <path d="M7.7 12.3l3 3 5.6-6" fill="none" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </span>
  )
}

// The Sub-tree tree: a rounded arrowhead on top, two stacked branches and a
// trunk, drawn white to sit inside the badge.
function TreeGlyph() {
  return (
    <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.3 L10 7.9 L12 7.05 L14 7.9 Z" fill="#ffffff" strokeWidth="1.25" />
      <path d="M9.2 11.3 L12 9.15 L14.8 11.3" strokeWidth="1.45" />
      <path d="M8.6 14.2 L12 11.65 L15.4 14.2" strokeWidth="1.45" />
      <path d="M12 14.75 V17.7" strokeWidth="1.45" />
    </g>
  )
}
