"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, BarChart2, Settings, LogOut, Wallet, Activity, MessageCircle, Megaphone, BadgeCheck, Receipt, Mail, ShieldCheck, ArrowLeftRight } from "lucide-react"
import { Logo } from "@/components/brand/Logo"

const NAV = [
  { label: "Dashboard",      href: "/admin",               icon: LayoutDashboard },
  { label: "Users",          href: "/admin/users",         icon: Users },
  { label: "Wallet",         href: "/admin/wallet",        icon: Wallet },
  { label: "Billing",        href: "/admin/billing",       icon: Receipt },
  { label: "Verifications",  href: "/admin/verifications", icon: BadgeCheck },
  { label: "Support",        href: "/admin/support",       icon: MessageCircle },
  { label: "Announcements",  href: "/admin/announcements", icon: Megaphone },
  { label: "Emails",         href: "/admin/emails",        icon: Mail },
  { label: "System health",  href: "/admin/system-health", icon: Activity },
  { label: "Analytics",      href: "/admin/analytics",     icon: BarChart2 },
  { label: "Settings",       href: "/admin/settings",      icon: Settings },
]

// Only super admins see Team (who may switch to the Sub-shop admin portal).
const SUPER_NAV = [{ label: "Team", href: "/admin/team", icon: ShieldCheck }]

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/dashboard"
  return pathname === href || pathname.startsWith(href + "/")
}

export function AdminLayout({
  children,
  adminEmail,
  superAdmin = false,
  subShopUrl = null,
}: {
  children: React.ReactNode
  adminEmail: string
  superAdmin?: boolean
  /** Set when this admin may switch to the Sub-shop admin portal. */
  subShopUrl?: string | null
}) {
  const pathname = usePathname()
  const nav = superAdmin ? [...NAV, ...SUPER_NAV] : NAV
  const router = useRouter()

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/sign-in")
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col fixed inset-y-0 left-0 border-r border-border bg-background z-20">
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link href="/admin">
            <Logo variant="lockup" />
          </Link>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-surface border border-border px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Admin navigation">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-surface text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-1">
          {subShopUrl && (
            <a
              href={subShopUrl}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold bg-[#fff1e6] text-[#c2410c] hover:bg-[#ffe6d1] transition-colors duration-150"
            >
              <ArrowLeftRight className="h-4 w-4 shrink-0" strokeWidth={2} />
              Switch to Sub-shop admin
            </a>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150"
          >
            ← Creator dashboard
          </Link>
          <button
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Sign out
          </button>
          <div className="px-3 py-1">
            <p className="text-xs text-muted-foreground truncate">{adminEmail}</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-56">
        {/* Mobile header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-10">
          <Link href="/admin">
            <Logo variant="icon" />
          </Link>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Admin
          </span>
          {subShopUrl && (
            <a href={subShopUrl} className="flex h-9 items-center gap-1.5 rounded-lg bg-[#fff1e6] px-2.5 text-xs font-semibold text-[#c2410c]" aria-label="Switch to Sub-shop admin">
              <ArrowLeftRight className="h-4 w-4" strokeWidth={2} /> Sub-shop
            </a>
          )}
          <button
            onClick={() => void handleSignOut()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        {/* Mobile nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background grid z-20"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
          aria-label="Mobile admin navigation"
        >
          {nav.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex flex-col items-center justify-center gap-1 transition-colors duration-150",
                  active ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 pb-16 md:pb-0 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
