import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    if (auth.user?.role !== 'admin') {
      throw redirect({ to: '/chat' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return <AuthenticatedLayout />
}
