'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAui, AuiProvider, Suggestions } from '@assistant-ui/react'
import { PanelLeftIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitch } from '@/components/theme-switch'
import { useIsMobile } from '@/hooks/use-mobile'
import { FAKE_CHAT_HISTORY } from './data/fake-chat-data'
import type { ChatHistoryItem } from './data/fake-chat-data'
import { ChatHistorySearchModal } from './components/chat-history-search-modal'
import {
  ChatRuntimeProvider,
  getThreadSummary,
  type MyMessage,
} from './components/chat-runtime-provider'
import { ChatSidebar } from './components/chat-sidebar'
import { Thread } from './components/thread'

function ThreadWithSuggestions() {
  const aui = useAui({
    suggestions: Suggestions([
      {
        title: 'Hello!',
        label: 'start a conversation',
        prompt: 'Hello! What can you help me with?',
      },
      {
        title: 'What can you do?',
        label: 'tell me your capabilities',
        prompt: 'What kinds of things can you help me with?',
      },
    ]),
  })
  return (
    <AuiProvider value={aui}>
      <Thread />
    </AuiProvider>
  )
}

export function Chat() {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [threadKey, setThreadKey] = useState(0)
  const [currentMessages, setCurrentMessages] = useState<MyMessage[]>([])
  const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>(() => [
    ...FAKE_CHAT_HISTORY,
  ])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const onMessagesChange = useCallback((messages: MyMessage[]) => {
    setCurrentMessages(messages)
  }, [])

  const startNewThread = useCallback(() => {
    if (currentMessages.length > 0) {
      const { title, preview } = getThreadSummary(currentMessages)
      setHistoryItems((prev) => [
        {
          id: `thread-${threadKey}-${Date.now()}`,
          title,
          preview,
          updatedAt: new Date(),
        },
        ...prev,
      ])
    }
    setThreadKey((k) => k + 1)
    if (isMobile) setSidebarOpen(false)
  }, [currentMessages, threadKey, isMobile])

  const sidebarItems = useMemo((): ChatHistoryItem[] => {
    if (currentMessages.length === 0) return historyItems
    const { title, preview } = getThreadSummary(currentMessages)
    return [
      { id: 'current', title, preview, updatedAt: new Date() },
      ...historyItems,
    ]
  }, [currentMessages, historyItems])

  return (
    <div className='flex h-dvh bg-background'>
      <ChatHistorySearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={sidebarItems}
      />
      {isMobile && sidebarOpen && (
        <button
          type='button'
          aria-label='Close sidebar'
          className='fixed inset-0 z-40 bg-black/50 md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <ChatSidebar
        open={sidebarOpen}
        overlay={isMobile}
        items={sidebarItems}
      />

      <div className='flex min-w-0 flex-1 flex-col min-h-0'>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-3 sm:gap-3 sm:px-4'>
          <Button
            data-sidebar='trigger'
            variant='outline'
            size='icon'
            className='size-7 shrink-0 max-md:scale-125'
            aria-label='Toggle Sidebar'
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <PanelLeftIcon />
            <span className='sr-only'>Toggle Sidebar</span>
          </Button>
          <div className='ms-auto flex shrink-0 items-center gap-1'>
          <Button
              variant='ghost'
              size='icon'
              className='size-8'
              aria-label='New chat'
              onClick={startNewThread}
            >
              <PlusIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              aria-label='Search chat history'
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className='size-4' />
            </Button>
            
            <ThemeSwitch />
          </div>
        </header>
        <div className='min-h-0 flex-1'>
          <ChatRuntimeProvider
            key={threadKey}
            onMessagesChange={onMessagesChange}
          >
            <ThreadWithSuggestions />
          </ChatRuntimeProvider>
        </div>
      </div>
    </div>
  )
}
