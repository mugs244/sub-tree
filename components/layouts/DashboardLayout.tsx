"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Link2, Activity, Palette, Settings, ExternalLink, LogOut } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  /** Other routes that should also light up this item (e.g. sub-pages reached from within it). */
  alsoActiveOn?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home",       href: "/dashboard",            icon: Home },
  { label: "Links",      href: "/dashboard/links",      icon: Link2 },
  { label: "Activity",   href: "/dashboard/activity",   icon: Activity },
  { label: "Appearance", href: "/dashboard/appearance", icon: Palette },
  { label: "Settings",   href: "/dashboard/settings",   icon: Settings, alsoActiveOn: ["/dashboard/support"] },
]

function isActive(pathname: string, href: string, alsoActiveOn?: string[]) {
  const matches = (h: string) => pathname === h || pathname.startsWith(h + "/")
  if (href === "/dashboard") return pathname === "/dashboard"
  return matches(href) || (alsoActiveOn?.some(matches) ?? false)
}

interface DashboardLayoutProps {
  children: React.ReactNode
  username: string
  displayName?: string
  avatarUrl?: string | null
  /** Unread notification count — shown as a badge on the Activity nav item. */
  unreadCount?: number
}

export function DashboardLayout({ children, username, displayName, avatarUrl, unreadCount = 0 }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const name = displayName || username

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/sign-in")
  }

  return (
    // .dash-root carries the dashboard's light/dark palette (globals.css).
    <div className="dash-root min-h-screen flex bg-background text-foreground">
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col fixed inset-y-0 left-0 border-r border-border bg-card z-20">
        <div className="h-16 flex items-center px-5">
          <Link href="/dashboard" aria-label="Dashboard home">
            <Logo variant="lockup" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map(({ label, href, icon: Icon, alsoActiveOn }) => {
            const active = isActive(pathname, href, alsoActiveOn)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "bg-[color:var(--dash-orange-soft)] text-[color:var(--dash-orange-text)] font-semibold"
                    : "text-muted-foreground font-medium hover:bg-surface hover:text-foreground",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span className="flex-1">{label}</span>
                {href === "/dashboard/activity" && unreadCount > 0 && (
                  <span
                    className="min-w-5 rounded-full bg-[color:var(--dash-orange)] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-[#111827]"
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 px-3 pb-4">
          <Link
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm transition-colors duration-150 hover:border-[color:var(--dash-orange)]"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">Your page</span>
              <span className="block truncate font-medium">sub-tree.com/{username}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          </Link>

          <ThemeToggle />

          <div className="flex items-center gap-3 rounded-xl px-1 pt-1">
            <Avatar name={name} url={avatarUrl} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">@{username}</span>
            </span>
            <button
              onClick={() => void handleSignOut()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex min-w-0 flex-col md:ml-64">
        <header className="md:hidden sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md">
          <Link href="/dashboard" aria-label="Dashboard home">
            <Logo variant="icon" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-[104px]">
              <ThemeToggle compact />
            </div>
            <button
              onClick={() => void handleSignOut()}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────── */}
      <nav
        className="md:hidden fixed inset-x-3 bottom-3 z-20 grid h-16 rounded-2xl border border-border bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md"
        style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon, alsoActiveOn }) => {
          const active = isActive(pathname, href, alsoActiveOn)
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center justify-center gap-1 transition-colors duration-150",
                active ? "text-[color:var(--dash-orange-text)]" : "text-muted-foreground",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={[
                  "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150",
                  active ? "bg-[color:var(--dash-orange-soft)]" : "",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                {href === "/dashboard/activity" && unreadCount > 0 && (
                  <span
                    className="absolute right-2 top-0.5 h-2 w-2 rounded-full bg-[color:var(--dash-orange)] ring-2 ring-card"
                    aria-label="Unread notifications"
                  />
                )}
              </span>
              <span className={["text-[10px]", active ? "font-semibold" : "font-medium"].join(" ")}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-orange)] text-sm font-bold text-[#111827]">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
