// The verified badge shown next to a verified creator's name. Creators pick
// one of two styles when they apply (Settings → Verification can change it):
//   classic — blue scalloped badge with a white tick
//   tree    — the same badge in Sub-tree navy with the tree mark
// Pure SVG with no client code, so it renders the same in server pages,
// templates and link-preview images.

import { TreeGlyph } from "@/components/brand/TreeGlyph"

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
        {variant === "tree" ? <TreeGlyph color="#ffffff" /> : <path d="M7.7 12.3l3 3 5.6-6" fill="none" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </span>
  )
}
