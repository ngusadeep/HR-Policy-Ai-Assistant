import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'hr_access_token'

export type UserRole = 'admin' | 'user'
export type UserStatus = 'active' | 'pending' | 'suspended'

export type UserGender = 'male' | 'female' | 'prefer_not_to_say'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  gender: UserGender
  title: string
  role: UserRole
  status: UserStatus
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAdmin: () => boolean
    isAuthenticated: () => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  return {
    auth: {
      user: null,
      accessToken: initToken,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, user: null, accessToken: '' } }
        }),
      isAdmin: () => get().auth.user?.role === 'admin',
      isAuthenticated: () => !!get().auth.accessToken && !!get().auth.user,
    },
  }
})
