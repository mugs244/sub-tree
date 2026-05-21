interface TreeMarkProps {
  className?: string;
}

function TreeMark({ className }: TreeMarkProps) {
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
      <path d="M12 3 L9 7 L12 7 L15 7 L12 3 Z" fill="currentColor" />
      <path d="M8 10 L12 6 L16 10" />
      <path d="M7 14 L12 9 L17 14" />
      <path d="M6 18 L12 12 L18 18" />
      <path d="M12 18 L12 21" strokeWidth="2" />
    </svg>
  );
}

interface IconBoxProps {
  size?: number;
  className?: string;
}

function IconBox({ size = 36, className }: IconBoxProps) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 rounded-lg bg-[color:var(--accent-primary)] ${className ?? ""}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <TreeMark className="text-white" style={{ width: size * 0.66, height: size * 0.66 }} />
    </div>
  );
}

interface WordmarkProps {
  className?: string;
}

function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={`font-semibold tracking-tight text-foreground ${className ?? ""}`}>
      Sub<span className="text-[color:var(--text-secondary)]">-</span>tree
    </span>
  );
}

interface LogoProps {
  variant?: "lockup" | "wordmark" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ variant = "lockup", size = "md", className }: LogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: "text-sm" },
    md: { icon: 36, text: "text-lg" },
    lg: { icon: 48, text: "text-2xl" },
  };

  const { icon: iconSize, text: textSize } = sizeMap[size];

  const icon = <IconBox size={iconSize} />;
  const wordmark = <Wordmark className={textSize} />;

  if (variant === "icon") {
    return <span className={className}>{icon}</span>;
  }

  if (variant === "wordmark") {
    return <span className={className}>{wordmark}</span>;
  }

  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {icon}
      {wordmark}
    </span>
  );
}
