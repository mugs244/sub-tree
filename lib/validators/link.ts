import { z } from "zod"

export const addLinkSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .max(2048, "URL is too long"),
  label: z
    .string()
    .min(1, "Label is required")
    .max(100, "Label must be at most 100 characters")
    .trim(),
})

export type AddLinkInput = z.infer<typeof addLinkSchema>
