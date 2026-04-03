import { FileText, FileCheck, FileClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type DocStatus = 'indexed' | 'processing' | 'failed'

interface PolicyDocument {
  id: string
  name: string
  category: string
  uploadedBy: string
  uploadedAt: string
  pages: number
  status: DocStatus
}

const documents: PolicyDocument[] = [
  {
    id: '1',
    name: 'Employee Leave Policy 2024',
    category: 'Leave',
    uploadedBy: 'HR Admin',
    uploadedAt: 'Today, 09:14',
    pages: 12,
    status: 'indexed',
  },
  {
    id: '2',
    name: 'Code of Conduct & Ethics',
    category: 'Conduct',
    uploadedBy: 'HR Admin',
    uploadedAt: 'Today, 08:45',
    pages: 28,
    status: 'indexed',
  },
  {
    id: '3',
    name: 'Health & Safety Handbook',
    category: 'Safety',
    uploadedBy: 'Jane Waweru',
    uploadedAt: 'Yesterday, 15:30',
    pages: 44,
    status: 'processing',
  },
  {
    id: '4',
    name: 'Recruitment & Selection Policy',
    category: 'Recruitment',
    uploadedBy: 'HR Admin',
    uploadedAt: 'Yesterday, 11:00',
    pages: 18,
    status: 'indexed',
  },
  {
    id: '5',
    name: 'Employee Benefits Guide 2024',
    category: 'Benefits',
    uploadedBy: 'James Maina',
    uploadedAt: '2 days ago',
    pages: 35,
    status: 'indexed',
  },
  {
    id: '6',
    name: 'Performance Management Framework',
    category: 'Performance',
    uploadedBy: 'HR Admin',
    uploadedAt: '3 days ago',
    pages: 22,
    status: 'failed',
  },
]

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

export function PolicyDocuments() {
  return (
    <div className='space-y-3'>
      {documents.map((doc) => {
        const { label, Icon, iconClass, badgeClass } = statusConfig[doc.status]
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
                <Badge variant='outline' className='px-1.5 py-0 text-xs font-normal'>
                  {doc.category}
                </Badge>
                <span>{doc.pages} pages</span>
                <span>·</span>
                <span>{doc.uploadedAt}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
