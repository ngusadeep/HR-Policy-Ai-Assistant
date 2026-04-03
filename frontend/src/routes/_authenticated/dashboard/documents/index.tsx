import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Documents } from '@/features/documents'

const documentsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  category: z
    .array(
      z.union([
        z.literal('leave'),
        z.literal('conduct'),
        z.literal('benefits'),
        z.literal('recruitment'),
        z.literal('safety'),
        z.literal('compensation'),
        z.literal('performance'),
      ])
    )
    .optional()
    .catch([]),
  status: z
    .array(
      z.union([
        z.literal('indexed'),
        z.literal('processing'),
        z.literal('failed'),
      ])
    )
    .optional()
    .catch([]),
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/documents/')({
  validateSearch: documentsSearchSchema,
  component: Documents,
})
