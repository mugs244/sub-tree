import { Home, Link2, Heart, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const mobileNavItems = [
  { label: "Home", icon: Home },
  { label: "Links", icon: Link2 },
  { label: "Donations", icon: Heart },
  { label: "Profile", icon: User },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col fixed inset-y-0 left-0 border-r border-border-default bg-background z-20">
        <div className="h-16 flex items-center px-5 border-b border-border-default">
          <Logo variant="lockup" />
        </div>

        {/* Nav placeholder — filled by feature 08 */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
          <div className="h-8 rounded-lg bg-surface" />
          <div className="h-8 rounded-lg bg-surface" />
          <div className="h-8 rounded-lg bg-surface" />
          <div className="h-8 rounded-lg bg-surface" />
        </nav>

        {/* User area placeholder */}
        <div className="h-16 flex items-center px-4 border-t border-border-default">
          <div className="h-8 w-8 rounded-full bg-surface" />
          <div className="ml-3 flex-1 h-4 rounded bg-surface" />
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-56">
        {/* Mobile header */}
        <header className="md:hidden h-14 flex items-center px-4 border-b border-border-default bg-background sticky top-0 z-10">
          <Logo variant="icon" />
          {/* Context-specific action slot — filled per route */}
        </header>

        <main className="flex-1 pb-16 md:pb-0 overflow-auto">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border-default bg-background grid grid-cols-4 z-20"
        aria-label="Mobile navigation"
      >
        {mobileNavItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center justify-center gap-1 text-[color:var(--text-muted)] hover:text-foreground transition-colors duration-150"
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
