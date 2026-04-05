import axios from 'axios'
import { toast } from 'sonner'

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input.',
  401: 'Invalid credentials.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. This record may already exist.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please slow down and try again.',
  500: 'Server error. Please try again later.',
  502: 'Server is temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',
}

/**
 * Extracts a user-friendly message from an API error and shows a toast.
 * Skips the toast if the interceptor already redirected to an error page.
 * Returns the message string so callers can use it (e.g. for inline form errors).
 */
export function handleServerError(error: unknown): string {
  // If the interceptor already redirected, don't also show a toast
  if (error && typeof error === 'object' && '_redirected' in error) {
    return ''
  }

  if (!axios.isAxiosError(error)) {
    const msg = 'Unable to connect. Please check your connection.'
    toast.error(msg)
    return msg
  }

  const status = error.response?.status
  const raw = error.response?.data?.message
  const backendMsg: string | undefined = Array.isArray(raw) ? raw[0] : raw

  const msg =
    backendMsg ??
    (status ? STATUS_MESSAGES[status] : undefined) ??
    'Something went wrong. Please try again.'

  toast.error(msg)
  return msg
}
