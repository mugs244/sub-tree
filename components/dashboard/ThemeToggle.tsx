"use client"

import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { DASH_THEME_STORAGE_KEY as STORAGE_KEY, type DashTheme } from "./theme"

// Light / dark / auto for the creator dashboard. The choice lives in
// localStorage (a per-device preference); "auto" follows the phone or
// computer's own setting and switches live when that changes. The resolved
// mode is written to <html data-dash-mode>, which the .dash-root palette in
// globals.css keys off.

function readTheme(): DashTheme {
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    return t === "light" || t === "dark" ? t : "system"
  } catch {
    return "system"
  }
}

function apply(theme: DashTheme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.setAttribute("data-dash-mode", dark ? "dark" : "light")
}

const OPTIONS: { value: DashTheme; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
]

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  // Starts as "system" for the server render; the real choice is read after
  // mount (the page colours are already right thanks to the init script).
  const [theme, setTheme] = useState<DashTheme>("system")

  useEffect(() => {
    const saved = readTheme()
    // Syncing from an external store (localStorage) on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(saved)
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => { if (readTheme() === "system") apply("system") }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  function choose(next: DashTheme) {
    setTheme(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
    apply(next)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour mode"
      className="inline-flex w-full items-center gap-0.5 rounded-xl border border-border bg-surface p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => choose(value)}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-1.5 text-xs font-medium transition-colors duration-150",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {!compact && label}
          </button>
        )
      })}
    </div>
  )
}
