// Sub-tree brand logo system
// Three variants: icon (square only), wordmark (text only), lockup (both)

import { cn } from "@/lib/utils";
import { TreeGlyph, TREE_VIEWBOX } from "@/components/brand/TreeGlyph";

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
        "bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0"
      )}
      aria-label="Sub-tree"
    >
      <TreeMark className={s.svg} />
    </div>
  );

  const Wordmark = (
    <span
      className={cn(
        s.text,
        "font-semibold tracking-tight text-foreground leading-none"
      )}
    >
      Sub<span className="text-muted-foreground">-</span>tree
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

/** The tree mark itself — the shared rounded tree, framed to fill its box. */
function TreeMark({ className }: { className?: string }) {
  return (
    <svg viewBox={TREE_VIEWBOX} className={className} aria-hidden="true">
      <TreeGlyph />
    </svg>
  );
}
