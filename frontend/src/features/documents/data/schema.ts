import { z } from 'zod'

export const docStatusSchema = z.union([
  z.literal('indexed'),
  z.literal('processing'),
  z.literal('failed'),
])
export type DocStatus = z.infer<typeof docStatusSchema>

export const docCategorySchema = z.union([
  z.literal('leave'),
  z.literal('conduct'),
  z.literal('benefits'),
  z.literal('recruitment'),
  z.literal('safety'),
  z.literal('compensation'),
  z.literal('performance'),
])
export type DocCategory = z.infer<typeof docCategorySchema>

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: docCategorySchema,
  status: docStatusSchema,
  pages: z.number(),
  fileSize: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.coerce.date(),
})
export type PolicyDocument = z.infer<typeof documentSchema>

export const documentListSchema = z.array(documentSchema)
