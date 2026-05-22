import { z } from "zod"

const ugandaPhoneRegex = /^(?:\+?256|0)(7[0-9])\d{7}$/

export const saveProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(80, "Display name must be at most 80 characters")
    .trim(),
  bio: z
    .string()
    .max(300, "Bio must be at most 300 characters")
    .optional()
    .transform((v) => v?.trim() || null),
  avatar_url: z
    .string()
    .url({ message: "Avatar must be a valid URL" })
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  momo_number: z
    .string()
    .regex(ugandaPhoneRegex, "Enter a valid Uganda mobile number (e.g. 0771234567)")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
})

export type SaveProfileInput = z.infer<typeof saveProfileSchema>
