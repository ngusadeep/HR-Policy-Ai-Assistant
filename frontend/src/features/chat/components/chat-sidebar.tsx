'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Logo } from '@/assets/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth-store'
import { ChatUserProfile } from './chat-user-profile'
import type { ChatHistoryItem } from '@/features/chat/data/chat-types'

type ChatSidebarProps = {
  open: boolean
  overlay?: boolean
  items?: ChatHistoryItem[]
  className?: string
}

export function ChatSidebar({
  open,
  overlay = false,
  items = [],
  className,
}: ChatSidebarProps) {
  const { auth } = useAuthStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const user = auth.user

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <>
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
          {/* Header */}
          <div className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
            <Logo className='size-5 shrink-0' />
            <h2 className='truncate text-sm font-semibold tracking-tight'>
              HR Ai Assistant
            </h2>
          </div>

          {/* Chat history */}
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

          {/* User footer */}
          <div className='shrink-0 border-t p-2'>
            <button
              type='button'
              onClick={() => setProfileOpen(true)}
              className='flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none'
            >
              <Avatar className='h-8 w-8 shrink-0 rounded-lg'>
                <AvatarFallback className='rounded-lg text-xs font-semibold'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium leading-none'>
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                  {user?.title || user?.email || ''}
                </p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <ChatUserProfile open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}
