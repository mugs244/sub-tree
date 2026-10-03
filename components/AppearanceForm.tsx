"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, Loader2, ExternalLink } from "lucide-react"
import { Label } from "@/components/ui/label"
import { DefaultAvatar } from "@/components/DefaultAvatar"
import {
  PAGE_TEMPLATES, PAGE_THEMES, resolveDesign, templateFor, themeFor,
  type PageTemplate, type PageTheme, type ProfileTemplate,
} from "@/lib/profile-templates"

const BUTTON_STYLES = [
  { value: "rounded", label: "Rounded", radius: "8px",    previewRadius: "rounded-lg" },
  { value: "pill",    label: "Pill",    radius: "9999px", previewRadius: "rounded-full" },
  { value: "sharp",   label: "Sharp",   radius: "0px",    previewRadius: "rounded-none" },
]

type SaveState = "idle" | "saving" | "saved" | "error"

interface AppearanceFormProps {
  initialTemplate: string | null
  initialTheme: string
  initialButtonStyle: string
  displayName?: string
  username?: string
  avatarUrl?: string
  bio?: string
}

// Dashboard → Appearance: pick a template (the layout) and a theme (the
// colours) separately; any combination works. Saves automatically.
export function AppearanceForm({
  initialTemplate,
  initialTheme,
  initialButtonStyle,
  displayName = "Your Name",
  username = "username",
  avatarUrl,
  bio,
}: AppearanceFormProps) {
  const [template, setTemplate] = useState(templateFor(initialTemplate, initialTheme).value)
  const [theme, setTheme] = useState(themeFor(initialTheme).value)
  const [buttonStyle, setButtonStyle] = useState(initialButtonStyle)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const activeButton = BUTTON_STYLES.find((s) => s.value === buttonStyle) ?? BUTTON_STYLES[0]!
  const design = resolveDesign(template, theme)

  const save = useCallback(async (tpl: string, th: string, b: string) => {
    setSaveState("saving")
    try {
      const res = await fetch("/api/profile/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_template: tpl, theme_preset: th, button_style: b }),
      })
      setSaveState(res.ok ? "saved" : "error")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }, [])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(template, theme, buttonStyle), 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [template, theme, buttonStyle, save])

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-14">
      {/* ── Controls ──────────────────────────────────────── */}
      <div className="flex-1 space-y-8 min-w-0">

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Template</Label>
            <SaveIndicator state={saveState} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PAGE_TEMPLATES.map((tpl) => (
              <TemplateCard
                key={tpl.value}
                template={tpl}
                design={resolveDesign(tpl.value, theme)}
                active={template === tpl.value}
                onClick={() => { navigator?.vibrate?.(20); setTemplate(tpl.value) }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme</Label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {PAGE_THEMES.map((th) => (
              <ThemeSwatch
                key={th.value}
                theme={th}
                active={theme === th.value}
                onClick={() => { navigator?.vibrate?.(20); setTheme(th.value) }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Button style</Label>
          <div className="grid grid-cols-3 gap-2">
            {BUTTON_STYLES.map((s) => {
              const active = buttonStyle === s.value
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { navigator?.vibrate?.(20); setButtonStyle(s.value) }}
                  aria-pressed={active}
                  className={[
                    "flex flex-col items-center gap-2.5 p-4 border-2 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                    active ? "border-foreground bg-surface shadow-sm" : "border-border hover:border-foreground/30",
                  ].join(" ")}
                >
                  <span className={["block w-full h-6 border border-border bg-background", s.previewRadius].join(" ")} />
                  <span className="text-[11px] font-medium">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <a
          href={`/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View live profile
        </a>
      </div>

      {/* ── Live preview ──────────────────────────────────── */}
      <div className="xl:w-72 shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Live preview
        </p>
        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-surface border-b border-border">
            <div className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </div>
            <span className="flex-1 text-center text-[10px] font-mono text-muted-foreground bg-background rounded px-2 py-0.5 border border-border">
              sub-tree.com/{username}
            </span>
          </div>
          <TemplatePreview
            design={design}
            radius={buttonStyle === "rounded" ? "14px" : activeButton.radius}
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl}
            bio={bio}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">Changes save automatically</p>
      </div>
    </div>
  )
}

function ThemeSwatch({ theme, active, onClick }: { theme: PageTheme; active: boolean; onClick: () => void }) {
  const p = theme.palette
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${theme.label} theme`}
      aria-pressed={active}
      className={[
        "group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        active ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30",
      ].join(" ")}
    >
      <span className="flex h-12 w-full items-center justify-center gap-1" style={{ background: p.canvas }}>
        <span className="h-5 w-5 rounded-full" style={{ background: p.accent, boxShadow: `0 0 0 2px ${p.panel}` }} />
        <span className="h-5 w-5 rounded-full" style={{ background: p.surface, boxShadow: `0 0 0 2px ${p.outline}` }} />
      </span>
      <span className="block px-1 py-1.5 text-center text-[10px] font-medium leading-none" style={{ background: p.panel, color: p.text }}>
        {theme.label}
      </span>
      {active && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10">
          <Check className="h-2.5 w-2.5 text-gray-900" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

function TemplateCard({
  template, design, active, onClick,
}: {
  template: PageTemplate
  design: ProfileTemplate
  active: boolean
  onClick: () => void
}) {
  const c = design.colors
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${template.label} template`}
      aria-pressed={active}
      className={[
        "group relative flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        active ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30",
      ].join(" ")}
    >
      {/* Miniature of the template in the current theme */}
      {template.value === "rows" ? (
        <span className="flex h-20 w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-1.5 pt-2" style={{ background: c.canvas }} aria-hidden="true">
          <span className="h-4 w-4 rounded-full bg-white shadow" />
          <span className="h-1 w-6 rounded-full" style={{ background: c.text }} />
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex h-2.5 w-full items-center justify-end rounded-sm pr-0.5" style={{ background: c.linkBg }}>
              <span className="h-1 w-1 rounded-full bg-white/80" />
            </span>
          ))}
        </span>
      ) : (
        <span className="flex h-20 w-16 shrink-0 rounded-lg p-1.5" style={{ background: c.canvas }} aria-hidden="true">
          <span className="flex flex-1 flex-col items-center gap-1 rounded-md px-1.5 pt-1.5" style={{ background: c.panel }}>
            <span className="h-3.5 w-3.5 rounded-full border" style={{ background: c.accent, borderColor: c.border }} />
            <span className="h-1 w-6 rounded-full" style={{ background: c.text }} />
            <span className="mt-0.5 h-2 w-full rounded border" style={{ background: c.linkBg, borderColor: c.border, boxShadow: `0 1px 0 0 ${c.ledge}` }} />
            <span className="h-2 w-full rounded border" style={{ background: c.linkBg, borderColor: c.border, boxShadow: `0 1px 0 0 ${c.ledge}` }} />
            <span className="h-2 w-full rounded border" style={{ background: c.accent, borderColor: c.border }} />
          </span>
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{template.label}</span>
        <span className="block text-[11px] leading-snug text-muted-foreground">{template.blurb}</span>
      </span>
      {active && (
        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground">
          <Check className="h-2.5 w-2.5 text-background" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

// Live preview — a scaled-down copy of the layouts in
// components/profile-templates/TemplatePage.tsx.
function TemplatePreview({
  design, radius, displayName, username, avatarUrl, bio,
}: {
  design: ProfileTemplate
  radius: string
  displayName: string
  username: string
  avatarUrl?: string
  bio?: string
}) {
  const c = design.colors
  if (design.layout === "rows") {
    const rowRadius = radius === "14px" ? "10px" : radius
    return (
      <div className="flex flex-col items-center px-4 py-6" style={{ background: c.canvas, color: c.text }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow-md">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-end overflow-hidden rounded-full" style={{ background: c.accent }}>
              <DefaultAvatar />
            </span>
          )}
        </div>
        <p className="mt-3 text-base font-semibold tracking-tight">{displayName}</p>
        <p className="text-[10px] font-medium" style={{ color: c.handle }}>@{username}</p>
        {bio && (
          <p className="mt-1 text-[10px] leading-relaxed max-w-[180px] text-center" style={{ color: c.muted }}>
            {bio.length > 80 ? bio.slice(0, 80) + "…" : bio}
          </p>
        )}
        <div className="mt-4 w-full space-y-2">
          {[["My Website", "mysite.com"], ["YouTube", "youtube.com/@you"], ["Instagram", "instagram.com/you"]].map(([label, sub]) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 shadow-sm" style={{ borderRadius: rowRadius, background: c.linkBg, color: c.linkText }}>
              <span className="h-3 w-3 rounded-full bg-white/80" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold leading-tight">{label}</span>
                <span className="block text-[8px] opacity-90">{sub}</span>
              </span>
              <span className="text-[10px]">›</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[9px]" style={{ color: c.muted }}>Powered by Sub-tree</p>
      </div>
    )
  }
  return (
    <div className="p-3" style={{ background: c.canvas }}>
      <div className="flex flex-col items-center gap-3.5 rounded-2xl px-4 py-6" style={{ background: c.panel, color: c.text }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover border-2" style={{ borderColor: c.border }} />
        ) : (
          <span className="flex h-14 w-14 items-end overflow-hidden rounded-full border-2" style={{ background: c.accent, borderColor: c.border }}>
            <DefaultAvatar color={c.accentText} />
          </span>
        )}
        <div className="text-center space-y-0.5">
          <p className="text-base font-bold tracking-tighter">{displayName}</p>
          <p className="text-[10px] font-semibold" style={{ color: c.handle }}>@{username}</p>
          {bio && (
            <p className="text-[10px] leading-relaxed max-w-[180px] mx-auto pt-0.5" style={{ color: c.muted }}>
              {bio.length > 80 ? bio.slice(0, 80) + "…" : bio}
            </p>
          )}
        </div>
        <div className="w-full space-y-2.5">
          {["My Website", "YouTube", "Instagram"].map((label) => (
            <div
              key={label}
              className="w-full border-2 py-2 text-center text-[10px] font-semibold"
              style={{ borderRadius: radius, background: c.linkBg, color: c.linkText, borderColor: c.border, boxShadow: `0 3px 0 0 ${c.ledge}` }}
            >
              {label}
            </div>
          ))}
          <div
            className="mt-1 w-full border-2 py-2 text-center text-[10px] font-bold"
            style={{ borderRadius: radius, background: c.accent, color: c.accentText, borderColor: c.ledge, boxShadow: `0 3px 0 0 ${c.ledge}` }}
          >
            Gift {displayName.split(" ")[0]}
          </div>
        </div>
        <p className="text-[9px]" style={{ color: c.muted }}>Powered by Sub-tree</p>
      </div>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null
  return (
    <span className={["inline-flex items-center gap-1 text-xs transition-opacity duration-150", state === "error" ? "text-destructive" : "text-muted-foreground"].join(" ")}>
      {state === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {state === "saved"  && <Check className="h-3 w-3 text-success" />}
      {state === "saving" && "Saving…"}
      {state === "saved"  && "Saved"}
      {state === "error"  && "Could not save — try again"}
    </span>
  )
}
