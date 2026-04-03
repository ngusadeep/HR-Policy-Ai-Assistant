import { type DocStatus, type DocCategory } from './schema'

export const statusStyles = new Map<DocStatus, string>([
  ['indexed', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['processing', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
  ['failed', 'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'],
])

export const categories: { label: string; value: DocCategory }[] = [
  { label: 'Leave', value: 'leave' },
  { label: 'Conduct', value: 'conduct' },
  { label: 'Benefits', value: 'benefits' },
  { label: 'Recruitment', value: 'recruitment' },
  { label: 'Safety', value: 'safety' },
  { label: 'Compensation', value: 'compensation' },
  { label: 'Performance', value: 'performance' },
]

export const statuses: { label: string; value: DocStatus }[] = [
  { label: 'Indexed', value: 'indexed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Failed', value: 'failed' },
]
