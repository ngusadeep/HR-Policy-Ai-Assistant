import { api } from '@/lib/api'
import type { AuthUser, UserGender } from '@/stores/auth-store'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  gender: UserGender
  title: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: AuthUser
}

export interface RegisterResponse {
  message: string
  userId: number
}

// All responses are wrapped by the backend's ResponseTransformInterceptor:
// { status, message, data: <actual payload> }
interface ApiEnvelope<T> {
  data: T
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', payload)
  return data.data
}

export async function registerApi(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<ApiEnvelope<RegisterResponse>>('/auth/register', payload)
  return data.data
}
