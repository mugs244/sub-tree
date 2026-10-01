"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Link2, Activity, Palette, Settings, ExternalLink, LogOut, Bell } from "lucide-react"
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
        <div className="h-16 flex items-center justify-between px-5">
          <Link href="/dashboard" aria-label="Dashboard home">
            <Logo variant="lockup" />
          </Link>
          <NotificationBell unreadCount={unreadCount} />
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
        {/* Phones: who you are (or the page you're on) + notifications. Theme
            and sign out live in Settings on phones. */}
        <header className="md:hidden sticky top-0 z-10 flex h-16 items-center justify-between gap-3 bg-background/85 px-4 backdrop-blur-md">
          <Link href="/dashboard/settings" className="flex min-w-0 items-center gap-3" aria-label="Your profile and settings">
            <Avatar name={name} url={avatarUrl} />
            {pathname === "/dashboard" ? (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-xs text-muted-foreground">Hi, {name.split(" ")[0]}</span>
                <span className="block truncate text-[15px] font-semibold">{greeting()}</span>
              </span>
            ) : (
              <span className="truncate text-lg font-bold tracking-tight">{pageTitle(pathname)}</span>
            )}
          </Link>
          <NotificationBell unreadCount={unreadCount} />
        </header>

        <main className="flex-1 pb-28 md:pb-0">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar: dark pill, icons only, active in orange ── */}
      <nav
        className="md:hidden fixed inset-x-4 bottom-4 z-20 flex h-16 items-center justify-around rounded-full bg-[#111827] px-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/10"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon, alsoActiveOn }) => {
          const active = isActive(pathname, href, alsoActiveOn)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={[
                "relative flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-150",
                active ? "bg-[#ff8a3d] text-[#111827]" : "text-white/70 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 2} />
              {href === "/dashboard/activity" && unreadCount > 0 && !active && (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff8a3d] ring-2 ring-[#111827]" aria-label="Unread notifications" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/links": "Links",
  "/dashboard/activity": "Activity",
  "/dashboard/appearance": "Appearance",
  "/dashboard/settings": "Settings",
  "/dashboard/support": "Support",
}

function pageTitle(pathname: string): string {
  const match = Object.keys(PAGE_TITLES).find((p) => pathname === p || pathname.startsWith(p + "/"))
  return match ? PAGE_TITLES[match]! : "Sub-tree"
}

// Kampala time on both server and client so the first render matches.
function greeting(): string {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Africa/Kampala" }))
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/dashboard/activity?filter=updates"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors duration-150 hover:bg-surface"
    >
      <Bell className="h-5 w-5" strokeWidth={1.9} />
      {unreadCount > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#ff8a3d] ring-2 ring-card" />}
    </Link>
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
