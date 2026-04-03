import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type QueryStatus = 'answered' | 'escalated' | 'pending'

interface RecentQuery {
  id: string
  user: string
  initials: string
  question: string
  topic: string
  status: QueryStatus
  time: string
}

const recentQueries: RecentQuery[] = [
  {
    id: '1',
    user: 'Alice Mwangi',
    initials: 'AM',
    question: 'How many annual leave days am I entitled to in my first year?',
    topic: 'Leave Policy',
    status: 'answered',
    time: '2 min ago',
  },
  {
    id: '2',
    user: 'Brian Ochieng',
    initials: 'BO',
    question: 'What is the process for reporting workplace harassment?',
    topic: 'Code of Conduct',
    status: 'answered',
    time: '14 min ago',
  },
  {
    id: '3',
    user: 'Carol Nduta',
    initials: 'CN',
    question: 'Can I carry over unused leave days to the next financial year?',
    topic: 'Leave Policy',
    status: 'escalated',
    time: '31 min ago',
  },
  {
    id: '4',
    user: 'David Kamau',
    initials: 'DK',
    question: 'What medical benefits are included in the health insurance plan?',
    topic: 'Benefits',
    status: 'answered',
    time: '1 hr ago',
  },
  {
    id: '5',
    user: 'Esther Njeri',
    initials: 'EN',
    question: 'What is the company policy on remote work arrangements?',
    topic: 'Work Policy',
    status: 'pending',
    time: '2 hr ago',
  },
  {
    id: '6',
    user: 'Felix Otieno',
    initials: 'FO',
    question: 'How is the performance bonus calculated at year-end?',
    topic: 'Compensation',
    status: 'escalated',
    time: '3 hr ago',
  },
]

const statusConfig: Record<QueryStatus, { label: string; className: string }> = {
  answered: {
    label: 'Answered',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
}

export function RecentQueries() {
  return (
    <div className='space-y-4'>
      {recentQueries.map((query) => {
        const { label, className } = statusConfig[query.status]
        return (
          <div key={query.id} className='flex items-start gap-3'>
            <Avatar className='mt-0.5 h-8 w-8 shrink-0'>
              <AvatarFallback className='text-xs'>{query.initials}</AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='truncate text-sm font-medium leading-none'>
                  {query.user}
                </span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {query.time}
                </span>
              </div>
              <p className='line-clamp-1 text-xs text-muted-foreground'>
                {query.question}
              </p>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='px-1.5 py-0 text-xs font-normal'>
                  {query.topic}
                </Badge>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    className
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
