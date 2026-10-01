import { Smartphone, Landmark, AtSign, KeyRound, Mail, Phone, CalendarDays, SunMoon, Gift, Headphones, LogOut, Trash2 } from "lucide-react"

// Icons are passed by name, not as components: the Settings page is a
// server component and its rows are client components, and React can't pass
// a component across that boundary.
const ICONS = {
  smartphone: Smartphone,
  bank: Landmark,
  username: AtSign,
  password: KeyRound,
  email: Mail,
  phone: Phone,
  calendar: CalendarDays,
  theme: SunMoon,
  gift: Gift,
  support: Headphones,
  logout: LogOut,
  trash: Trash2,
} as const

export type SettingsIcon = keyof typeof ICONS

// Left side of a Settings row: optional icon + label, matching the grouped
// card style of the Settings page.
export function RowLabel({ icon, label }: { icon?: SettingsIcon; label: string }) {
  const Icon = icon ? ICONS[icon] : null
  return (
    <span className="flex min-w-0 items-center gap-3 text-[15px] text-foreground">
      {Icon && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />}
      <span className="truncate">{label}</span>
    </span>
  )
}

export function RowIcon({ icon, className = "" }: { icon: SettingsIcon; className?: string }) {
  const Icon = ICONS[icon]
  return <Icon className={["h-5 w-5 shrink-0 text-muted-foreground", className].join(" ")} strokeWidth={1.75} aria-hidden="true" />
}
