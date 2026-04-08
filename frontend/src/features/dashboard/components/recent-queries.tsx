import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { RecentQueryItem } from '../api/dashboard-api'

function formatRelative(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

interface RecentQueriesProps {
  queries: RecentQueryItem[]
}

export function RecentQueries({ queries }: RecentQueriesProps) {
  if (queries.length === 0) {
    return (
      <p className='py-4 text-center text-sm text-muted-foreground'>
        No queries yet. Employees will appear here once they start chatting.
      </p>
    )
  }

  return (
    <div className='space-y-4'>
      {queries.map((query) => {
        // Build initials from the session ID (no user attached) or a placeholder
        const initials = query.sessionId.slice(0, 2).toUpperCase()
        return (
          <div key={query.sessionId} className='flex items-start gap-3'>
            <Avatar className='mt-0.5 h-8 w-8 shrink-0'>
              <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='truncate text-xs font-mono text-muted-foreground'>
                  {query.sessionId.slice(0, 8)}…
                </span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {formatRelative(query.askedAt)}
                </span>
              </div>
              <p className='line-clamp-2 text-sm text-foreground'>
                {query.question}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
