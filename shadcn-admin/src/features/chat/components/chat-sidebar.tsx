'use client'

import { cn } from '@/lib/utils'
import { Logo } from '@/assets/logo'
import type { ChatHistoryItem } from '@/features/chat/data/fake-chat-data'

type ChatSidebarProps = {
  open: boolean
  /** When true, sidebar is fixed overlay (e.g. on mobile) and slides in/out */
  overlay?: boolean
  /** Chat history items to list (e.g. fake data for static demo). */
  items?: ChatHistoryItem[]
  className?: string
}

export function ChatSidebar({
  open,
  overlay = false,
  items = [],
  className,
}: ChatSidebarProps) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r bg-background',
        overlay
          ? 'fixed inset-y-0 left-0 z-50 h-dvh w-64 transition-transform duration-200 ease-out'
          : 'transition-[width] duration-200 ease-out',
        overlay ? (open ? 'translate-x-0' : '-translate-x-full') : undefined,
        !overlay && (open ? 'w-64' : 'w-0 overflow-hidden'),
        className
      )}
      aria-hidden={!open}
    >
      <div className='flex h-full w-64 flex-col'>
        <div className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <Logo className='size-5 shrink-0' />
          <h2 className='truncate text-sm font-semibold tracking-tight'>
            HR Ai Assistant
          </h2>
        </div>
        <div className='flex-1 overflow-y-auto p-2'>
          {items.length === 0 ? (
            <p className='px-2 text-xs text-muted-foreground'>
              Conversations will appear here.
            </p>
          ) : (
            <ul className='flex flex-col gap-0.5'>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type='button'
                    className='w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none'
                  >
                    <span className='block truncate font-medium'>{item.title}</span>
                    {item.preview && (
                      <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
                        {item.preview}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
