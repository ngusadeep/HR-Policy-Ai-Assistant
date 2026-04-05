import { Shield, UserCheck } from 'lucide-react'
import { type UserStatus } from './schema'

export const statusStyles = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['pending', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
  ['suspended', 'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'],
])

export const roles = [
  { label: 'Admin', value: 'Admin', icon: Shield },
  { label: 'User', value: 'User', icon: UserCheck },
] as const

export const statuses = [
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
] as const
