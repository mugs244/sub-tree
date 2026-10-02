// The verified badge shown next to a verified creator's name. Placeholder
// design until the final badge artwork is supplied — replace the SVG here and
// it updates everywhere (public page, templates, dashboard).
export function VerifiedBadge({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Verified"
      title="Verified — this creator's identity has been checked"
      className={["inline-flex shrink-0 align-middle", className].join(" ")}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#ff8a3d"
          d="M12 1.5l2.39 1.74 2.95-.03.91 2.8 2.39 1.73-.92 2.8.92 2.8-2.39 1.74-.91 2.8-2.95-.03L12 19.5l-2.39-1.74-2.95.03-.91-2.8-2.39-1.73.92-2.8-.92-2.8 2.39-1.74.91-2.8 2.95.03z"
          transform="translate(0 1.5)"
        />
        <path d="M8.2 12.6l2.6 2.6 5-5.2" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
