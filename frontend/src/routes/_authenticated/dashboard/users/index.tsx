import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'
import { roles } from '@/features/users/data/data'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(['active', 'pending', 'suspended']))
    .optional()
    .catch([]),
  role: z
    .array(z.enum(roles.map((r) => r.value) as [string, ...string[]]))
    .optional()
    .catch([]),
  email: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
