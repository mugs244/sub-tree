import { PASSWORD_RULES } from "@/lib/validators/password"
import { cn } from "@/lib/utils"

// Live two-column checklist under a new-password field; each dot fills in
// as its rule is met.
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password)
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              met ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                met ? "bg-[color:var(--accent-primary)]" : "bg-[color:var(--border-default)]",
              )}
            />
            {rule.label}
            <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
          </li>
        )
      })}
    </ul>
  )
}
