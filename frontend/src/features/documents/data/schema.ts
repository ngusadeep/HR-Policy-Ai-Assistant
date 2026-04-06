import { z } from 'zod'

export const docStatusSchema = z.enum(['indexed', 'processing', 'failed'])
export type DocStatus = z.infer<typeof docStatusSchema>

export const documentSchema = z.object({
  id: z.number(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  collection: z.string(),
  status: docStatusSchema,
  chunkCount: z.number(),
  errorMessage: z.string().nullable(),
  uploadedBy: z
    .object({ id: z.number(), firstName: z.string(), lastName: z.string() })
    .nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type PolicyDocument = z.infer<typeof documentSchema>
