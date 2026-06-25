"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Rss, Users, Heart, LayoutDashboard, LogOut, ExternalLink } from "lucide-react"
import { Logo } from "@/components/brand/Logo"

const NAV = [
  { label: "Feed",      href: "/fan/feed",      icon: Rss },
  { label: "Following", href: "/fan/following",  icon: Users },
  { label: "Support",   href: "/fan/support",    icon: Heart },
]

interface Props {
  children: React.ReactNode
  username: string | null
  displayName: string
  isCreator: boolean
}

export function FanNav({ children, username, displayName, isCreator }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/sign-in")
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex w-52 shrink-0 flex-col fixed inset-y-0 left-0 border-r border-border bg-background z-20">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/fan/feed">
            <Logo variant="lockup" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-1">
          {isCreator && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Creator Dashboard
            </Link>
          )}
          {username && (
            <Link
              href={`/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              View profile
            </Link>
          )}
          <button onClick={() => void handleSignOut()} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors w-full">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Sign out
          </button>
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            {username && <p className="text-xs text-muted-foreground font-mono">@{username}</p>}
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-52">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-10">
          <Link href="/fan/feed">
            <Logo variant="icon" />
          </Link>
          <button onClick={() => void handleSignOut()} className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        <main className="flex-1 pb-16 md:pb-0 overflow-auto">{children}</main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background grid z-20"
        style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}
      >
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
