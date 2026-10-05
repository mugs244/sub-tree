// Sub-shop logo: the Sub-tree rounded tree in a navy circle, plus the name in
// the page font (Geist). Same tree drawing as sub-tree.com's logo.
export function SubShopLogo({ className = "" }: { className?: string }) {
  return (
    <span className={["inline-flex items-center gap-2", className].join(" ")} aria-label="Sub-shop">
      <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#111827" />
        <g transform="translate(12 12) scale(0.86) translate(-12 -11.5)" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5.3 L10 7.9 L12 7.05 L14 7.9 Z" fill="#ffffff" strokeWidth="1.25" />
          <path d="M9.2 11.3 L12 9.15 L14.8 11.3" strokeWidth="1.45" />
          <path d="M8.6 14.2 L12 11.65 L15.4 14.2" strokeWidth="1.45" />
          <path d="M12 14.75 V17.7" strokeWidth="1.45" />
        </g>
      </svg>
      <span className="text-[22px] font-bold tracking-tight text-primary leading-none">
        Sub<span className="text-[#f97316]">-</span>shop
      </span>
    </span>
  )
}
