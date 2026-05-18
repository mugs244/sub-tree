import { Logo } from "@/components/brand/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="h-16 flex items-center px-6 bg-background border-b border-border-default">
        <Logo variant="lockup" />
      </header>

      <main className="flex-1 flex items-center justify-center py-12 md:py-16 px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-6 flex items-center justify-center gap-6 text-xs text-[color:var(--text-muted)]">
        <a
          href="/privacy"
          className="hover:text-foreground transition-colors duration-150"
        >
          Privacy
        </a>
        <a
          href="/terms"
          className="hover:text-foreground transition-colors duration-150"
        >
          Terms
        </a>
        <a
          href="/help"
          className="hover:text-foreground transition-colors duration-150"
        >
          Help
        </a>
      </footer>
    </div>
  );
}
