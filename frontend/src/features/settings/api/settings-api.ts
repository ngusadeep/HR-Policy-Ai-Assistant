import { api } from '@/lib/api'
import type { AuthUser } from '@/stores/auth-store'

interface ApiEnvelope<T> {
  data: T
}

export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  email: string
  gender: 'male' | 'female' | 'prefer_not_to_say'
  title: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface TransferAdminUserOption {
  id: number
  firstName: string
  lastName: string
  email: string
  title: string
}

export async function updateProfileApi(payload: UpdateProfilePayload): Promise<AuthUser> {
  const { data } = await api.patch<ApiEnvelope<AuthUser>>('/auth/profile', payload)
  return data.data
}

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/auth/change-password', payload)
  return data.data
}

export async function deleteAccountApi(): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>('/auth/account')
  return data.data
}

export async function transferAdminRoleApi(targetUserId: number): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>(`/auth/transfer-admin/${targetUserId}`)
  return data.data
}

export async function fetchActiveUsersApi(): Promise<TransferAdminUserOption[]> {
  const { data } = await api.get<ApiEnvelope<{ id: number; firstName: string; lastName: string; email: string; title: string; status: string; role: { name: string } | null }[]>>('/users')
  return data.data
    .filter((u) => u.status === 'active' && u.role?.name !== 'Admin')
    .map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, title: u.title }))
}
