import { api } from '@/lib/api'
import { roleSchema, type Role } from '../data/schema'

interface ApiEnvelope<T> {
  data: T
}

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/roles')
  return data.data.map((r) => roleSchema.parse(r))
}

export async function createRole(name: string): Promise<Role> {
  const { data } = await api.post<ApiEnvelope<unknown>>('/roles', { name })
  return roleSchema.parse(data.data)
}

export async function updateRole(
  id: number,
  payload: { name?: string; permissions?: string[] }
): Promise<Role> {
  const { data } = await api.patch<ApiEnvelope<unknown>>(`/roles/${id}`, payload)
  return roleSchema.parse(data.data)
}
