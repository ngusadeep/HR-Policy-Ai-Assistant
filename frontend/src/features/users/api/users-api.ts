import { api } from '@/lib/api'
import { userListSchema, type User, type UserStatus } from '../data/schema'

interface ApiEnvelope<T> {
  data: T
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/users')
  return userListSchema.parse(data.data)
}

export async function updateUserStatus(userId: number, status: UserStatus): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<User>>(`/users/${userId}/status`, { status })
  return data.data
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`)
}
