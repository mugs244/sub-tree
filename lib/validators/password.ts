import { z } from "zod"

// One source of truth for new-password strength: the live checklist on the
// sign-up page and every server route that sets a password use these rules.
// Existing passwords are never re-checked, so tightening them doesn't lock
// anyone out — it only applies the next time a password is chosen.
export const PASSWORD_RULES = [
  { id: "lower", label: "One lowercase character", test: (p: string) => /[a-z]/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  { id: "upper", label: "One uppercase character", test: (p: string) => /[A-Z]/.test(p) },
  { id: "length", label: "8 characters minimum", test: (p: string) => p.length >= 8 },
  { id: "number", label: "One number", test: (p: string) => /[0-9]/.test(p) },
] as const

export function passwordMeetsRules(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password))
}

export const newPasswordSchema = z
  .string()
  .refine(passwordMeetsRules, {
    message: "Password needs 8+ characters with an uppercase letter, a lowercase letter, a number and a special character",
  })
