"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CalendarDays, BarChart3, FileText, Wallet, Layers, Users, Settings, Bell, LogOut, BadgeCheck } from "lucide-react"
import { Logo } from "@/components/brand/Logo"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

// Home is deferred per the Business Tier spec — everything else is wired up.
const NAV_ITEMS: NavItem[] = [
  { label: "Ad slots", href: "/business/ad-slots", icon: CalendarDays },
  { label: "Analytics", href: "/business/analytics", icon: BarChart3 },
  { label: "Posts", href: "/business/posts", icon: FileText },
  { label: "Wallet", href: "/business/wallet", icon: Wallet },
  { label: "Credits", href: "/business/credits", icon: Layers },
  { label: "Notifications", href: "/business/notifications", icon: Bell },
  { label: "Team", href: "/business/team", icon: Users },
  { label: "Settings", href: "/business/settings", icon: Settings },
]

// The mobile bottom bar can't hold every item comfortably — show the core few.
const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Ad slots", href: "/business/ad-slots", icon: CalendarDays },
  { label: "Wallet", href: "/business/wallet", icon: Wallet },
  { label: "Alerts", href: "/business/notifications", icon: Bell },
  { label: "Settings", href: "/business/settings", icon: Settings },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}

interface BusinessDashboardLayoutProps {
  children: React.ReactNode
  companyName: string
  verified: boolean
  /** Unread notification count — shows a dot on the Notifications nav item. */
  unreadCount?: number
}

export function BusinessDashboardLayout({ children, companyName, verified, unreadCount = 0 }: BusinessDashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/sign-in")
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-56 shrink-0 flex-col fixed inset-y-0 left-0 border-r border-border bg-background z-20">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/business/ad-slots">
            <Logo variant="lockup" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Business navigation">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  active ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.5} />
                {label}
                {href === "/business/notifications" && unreadCount > 0 && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground shrink-0" aria-label="Unread notifications" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-1">
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150 w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Sign out
          </button>
          <div className="px-3 py-2 flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">{companyName}</span>
            <BadgeCheck
              className={["h-3.5 w-3.5 shrink-0", verified ? "text-foreground" : "text-muted-foreground/40"].join(" ")}
              strokeWidth={1.75}
              aria-label={verified ? "Verified" : "Not verified"}
            />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-56">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-10">
          <Link href="/business/ad-slots">
            <Logo variant="icon" />
          </Link>
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        <main className="flex-1 pb-16 md:pb-0 overflow-auto">{children}</main>
      </div>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background grid z-20"
        style={{ gridTemplateColumns: `repeat(${MOBILE_NAV_ITEMS.length}, minmax(0, 1fr))` }}
        aria-label="Mobile business navigation"
      >
        {MOBILE_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={["flex flex-col items-center justify-center gap-1 transition-colors duration-150", active ? "text-foreground" : "text-muted-foreground"].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                {href === "/business/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-foreground" aria-label="Unread notifications" />
                )}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
