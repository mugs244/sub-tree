// Sub-tree brand logo system
// Three variants: icon (square only), wordmark (text only), lockup (both)

import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "icon" | "wordmark" | "lockup";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { box: "w-7 h-7", svg: "w-5 h-5", text: "text-base" },
  md: { box: "w-9 h-9", svg: "w-6 h-6", text: "text-lg" },
  lg: { box: "w-12 h-12", svg: "w-8 h-8", text: "text-2xl" },
};

export function Logo({
  variant = "lockup",
  size = "md",
  className,
}: LogoProps) {
  const s = SIZE_MAP[size];

  const Icon = (
    <div
      className={cn(
        s.box,
        "bg-primary rounded-lg flex items-center justify-center shrink-0"
      )}
      aria-label="Sub-tree"
    >
      <TreeMark className={cn(s.svg, "text-base")} />
    </div>
  );

  const Wordmark = (
    <span
      className={cn(
        s.text,
        "font-semibold tracking-tight text-primary leading-none"
      )}
    >
      Sub<span className="text-muted">-</span>tree
    </span>
  );

  if (variant === "icon") return <div className={className}>{Icon}</div>;
  if (variant === "wordmark") return <div className={className}>{Wordmark}</div>;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {Icon}
      {Wordmark}
    </div>
  );
}

/**
 * The tree mark itself.
 * Pine-tree silhouette built from stacked V-shapes.
 * Stroke-based, so it scales cleanly at any size.
 */
function TreeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Top peak */}
      <path d="M12 3 L9 7 L12 7 L15 7 L12 3 Z" fill="currentColor" />
      {/* Upper branches */}
      <path d="M8 10 L12 6 L16 10" />
      {/* Middle branches */}
      <path d="M7 14 L12 9 L17 14" />
      {/* Lower branches */}
      <path d="M6 18 L12 12 L18 18" />
      {/* Trunk */}
      <path d="M12 18 L12 21" strokeWidth="2" />
    </svg>
  );
}
