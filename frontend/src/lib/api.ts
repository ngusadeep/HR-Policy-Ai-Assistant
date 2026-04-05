import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Status codes that redirect to a dedicated error page.
 * We mark the error as `_redirected` so handleServerError skips the toast.
 */
const ERROR_PAGE_REDIRECTS: Record<number, string> = {
  403: '/403',
  500: '/500',
  502: '/500',
  503: '/503',
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status
    const url: string = error.config?.url ?? ''
    const isAuthRoute = url.includes('/auth/')

    // 401 on protected routes — session expired
    if (status === 401 && !isAuthRoute) {
      useAuthStore.getState().auth.reset()
      window.location.href = '/sign-in'
      error._redirected = true
      return Promise.reject(error)
    }

    // 403 / 500 / 502 / 503 — redirect to error page
    const errorPage = status ? ERROR_PAGE_REDIRECTS[status] : undefined
    if (errorPage && !isAuthRoute) {
      window.location.href = errorPage
      error._redirected = true
    }

    return Promise.reject(error)
  },
)
