import { z } from "zod"

const urlField = z.string().url("Must be a valid URL").max(2048, "URL is too long")
const labelField = z.string().min(1, "Label is required").max(100, "Label must be at most 100 characters").trim()

export const addLinkSchema = z.object({
  url: urlField,
  label: labelField,
})

export const updateLinkSchema = z.object({
  url: urlField.optional(),
  label: labelField.optional(),
  is_enabled: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, "At least one field must be provided")

export const reorderLinkSchema = z.object({
  direction: z.enum(["up", "down"]),
})

export type AddLinkInput = z.infer<typeof addLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>
export type ReorderLinkInput = z.infer<typeof reorderLinkSchema>
