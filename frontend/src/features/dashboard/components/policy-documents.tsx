import { FileText, FileCheck, FileClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DocStatus } from '@/features/documents/data/schema'
import type { RecentDocumentItem } from '../api/dashboard-api'

const statusConfig: Record<DocStatus, { label: string; Icon: typeof FileCheck; iconClass: string; badgeClass: string }> = {
  indexed: {
    label: 'Indexed',
    Icon: FileCheck,
    iconClass: 'text-green-500',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  processing: {
    label: 'Processing',
    Icon: FileClock,
    iconClass: 'text-yellow-500',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  failed: {
    label: 'Failed',
    Icon: FileText,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

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

interface PolicyDocumentsProps {
  documents: RecentDocumentItem[]
}

export function PolicyDocuments({ documents }: PolicyDocumentsProps) {
  if (documents.length === 0) {
    return (
      <p className='py-4 text-center text-sm text-muted-foreground'>
        No documents uploaded yet.
      </p>
    )
  }

  return (
    <div className='space-y-3'>
      {documents.map((doc) => {
        const cfg = statusConfig[doc.status] ?? statusConfig.failed
        const { label, Icon, iconClass, badgeClass } = cfg
        return (
          <div key={doc.id} className='flex items-center gap-3'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50'>
              <Icon className={cn('h-4 w-4', iconClass)} />
            </div>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <div className='flex items-center justify-between gap-2'>
                <span className='truncate text-sm font-medium leading-none'>
                  {doc.name}
                </span>
                <span
                  className={cn(
                    'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    badgeClass
                  )}
                >
                  {label}
                </span>
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                {doc.chunkCount > 0 && (
                  <Badge variant='outline' className='px-1.5 py-0 text-xs font-normal'>
                    {doc.chunkCount} chunks
                  </Badge>
                )}
                {doc.uploadedBy && <span>{doc.uploadedBy}</span>}
                <span>·</span>
                <span>{formatRelative(doc.uploadedAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
