import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    if (!auth.accessToken || !auth.user) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: AuthenticatedOutlet,
})

function AuthenticatedOutlet() {
  return <Outlet />
}
