import { z } from 'zod'

export const userStatusSchema = z.enum(['active', 'pending', 'suspended'])
export type UserStatus = z.infer<typeof userStatusSchema>

export const userRoleSchema = z.enum(['Admin', 'User'])
export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  gender: z.enum(['male', 'female', 'prefer_not_to_say']),
  title: z.string(),
  status: userStatusSchema,
  role: z
    .object({
      id: z.number(),
      name: userRoleSchema,
    })
    .nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof userSchema>
export const userListSchema = z.array(userSchema)
