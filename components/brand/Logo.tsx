interface LogoProps {
  variant?: "lockup" | "wordmark" | "icon";
  className?: string;
}

function TreeBranchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <line x1="10" y1="17" x2="10" y2="10" />
      <line x1="10" y1="14" x2="6" y2="9" />
      <line x1="10" y1="12" x2="14" y2="7" />
      <line x1="6" y1="9" x2="4" y2="6" />
      <line x1="14" y1="7" x2="16" y2="4" />
    </svg>
  );
}

export function Logo({ variant = "lockup", className }: LogoProps) {
  const icon = (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      aria-hidden="true"
    >
      <TreeBranchIcon />
    </span>
  );

  const wordmark = (
    <span className="font-semibold tracking-tight text-foreground">
      Sub-tree
    </span>
  );

  if (variant === "icon") {
    return <span className={className}>{icon}</span>;
  }

  if (variant === "wordmark") {
    return <span className={className}>{wordmark}</span>;
  }

  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      {icon}
      {wordmark}
    </span>
  );
}
