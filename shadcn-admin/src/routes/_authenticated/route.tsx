import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedOutlet,
})

function AuthenticatedOutlet() {
  return <Outlet />
}
