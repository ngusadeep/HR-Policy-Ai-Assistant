import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN_KEY = 'hr_access_token'
const AUTH_USER_KEY = 'hr_auth_user'

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
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function persistUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_USER_KEY)
  }
}

interface AuthState {
  auth: {
    user: AuthUser | null
    accessToken: string
    setUser: (user: AuthUser | null) => void
    setAccessToken: (accessToken: string) => void
    setUserAndToken: (user: AuthUser, accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAdmin: () => boolean
    isAuthenticated: () => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieToken = getCookie(ACCESS_TOKEN_KEY)
  let initToken = ''
  try {
    initToken = cookieToken ? JSON.parse(cookieToken) : ''
  } catch {
    initToken = ''
  }
  const initUser = loadUser()

  return {
    auth: {
      user: initUser,
      accessToken: initToken,

      setUser: (user) => {
        persistUser(user)
        set((state) => ({ ...state, auth: { ...state.auth, user } }))
      },

      setAccessToken: (accessToken) => {
        setCookie(ACCESS_TOKEN_KEY, JSON.stringify(accessToken))
        set((state) => ({ ...state, auth: { ...state.auth, accessToken } }))
      },

      setUserAndToken: (user, accessToken) => {
        persistUser(user)
        setCookie(ACCESS_TOKEN_KEY, JSON.stringify(accessToken))
        set((state) => ({ ...state, auth: { ...state.auth, user, accessToken } }))
      },

      resetAccessToken: () => {
        removeCookie(ACCESS_TOKEN_KEY)
        set((state) => ({ ...state, auth: { ...state.auth, accessToken: '' } }))
      },

      reset: () => {
        removeCookie(ACCESS_TOKEN_KEY)
        persistUser(null)
        set((state) => ({ ...state, auth: { ...state.auth, user: null, accessToken: '' } }))
      },

      isAdmin: () => get().auth.user?.role === 'admin',
      isAuthenticated: () => !!get().auth.accessToken && !!get().auth.user,
    },
  }
})
