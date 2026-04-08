import { z } from 'zod'

export const permissionSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  permissions: z.array(permissionSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Permission = z.infer<typeof permissionSchema>
export type Role = z.infer<typeof roleSchema>
