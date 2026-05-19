import { z } from "zod"

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]{2}$/,
    "Username can only contain lowercase letters, numbers, hyphens, and underscores, and must start and end with a letter or number",
  )
  .refine(
    (val) => !/__/.test(val) && !/-{2}/.test(val) && !/-_/.test(val) && !/_-/.test(val),
    "Username cannot contain consecutive special characters",
  )

export const claimUsernameSchema = z.object({
  username: usernameSchema,
})

export type ClaimUsernameInput = z.infer<typeof claimUsernameSchema>
