'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatHistoryItem } from '@/features/chat/data/fake-chat-data'

export type { ChatHistoryItem }

type ChatHistorySearchModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** List of chat history items to search. Replace with real data source when wired. */
  items?: ChatHistoryItem[]
  onSelectItem?: (item: ChatHistoryItem) => void
}

function filterItems(items: ChatHistoryItem[], query: string): ChatHistoryItem[] {
  if (!query.trim()) return items
  const q = query.trim().toLowerCase()
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      (item.preview?.toLowerCase().includes(q) ?? false)
  )
}

export function ChatHistorySearchModal({
  open,
  onOpenChange,
  items = [],
  onSelectItem,
}: ChatHistorySearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = filterItems(items, query)

  useEffect(() => {
    if (open) {
      setQuery('')
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleSelect = useCallback(
    (item: ChatHistoryItem) => {
      onSelectItem?.(item)
      onOpenChange(false)
      setQuery('')
    },
    [onOpenChange, onSelectItem]
  )

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setQuery('')
      onOpenChange(next)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='flex max-h-[85dvh] flex-col gap-4 sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold'>
            Search chat history
          </DialogTitle>
          <DialogDescription className='sr-only'>
            Search your chat history by title or preview. Results update as you
            type.
          </DialogDescription>
        </DialogHeader>
        <div className='relative'>
          <SearchIcon className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            ref={inputRef}
            type='search'
            placeholder='Search conversations...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='pl-9'
            autoComplete='off'
            aria-label='Search chat history'
          />
        </div>
        <ScrollArea className={cn('min-h-[120px] flex-1 rounded-md border')}>
          <div className='p-2'>
            {filtered.length === 0 && (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                {items.length === 0
                  ? 'No chat history yet.'
                  : query.trim()
                    ? `No results for "${query.trim()}".`
                    : 'Type to search conversations.'}
              </p>
            )}
            {filtered.length > 0 && (
              <ul className='flex flex-col gap-0.5' role='listbox'>
                {filtered.map((item) => (
                  <li key={item.id}>
                    <button
                      type='button'
                      role='option'
                      className='w-full rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none'
                      onClick={() => handleSelect(item)}
                    >
                      <span className='font-medium'>{item.title}</span>
                      {item.preview && (
                        <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                          {item.preview}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
