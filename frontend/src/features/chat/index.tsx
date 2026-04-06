'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAui, AuiProvider, Suggestions } from '@assistant-ui/react'
import { PanelLeftIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitch } from '@/components/theme-switch'
import { useIsMobile } from '@/hooks/use-mobile'
import type { ChatHistoryItem } from './data/chat-types'
import { ChatHistorySearchModal } from './components/chat-history-search-modal'
import {
  ChatRuntimeProvider,
  getThreadSummary,
  type MyMessage,
} from './components/chat-runtime-provider'
import { wsChatStream } from './api/chat-ws'
import { ChatSidebar } from './components/chat-sidebar'
import { Thread } from './components/thread'

function ThreadWithSuggestions() {
  const aui = useAui({
    suggestions: Suggestions([
      {
        title: 'How many leave days do I get?',
        label: 'annual leave policy',
        prompt: 'How many days of annual leave am I entitled to?',
      },
      {
        title: 'Can I work from home?',
        label: 'remote work policy',
        prompt: 'What is the company remote work or work-from-home policy?',
      },
      {
        title: 'How do I submit expenses?',
        label: 'expenses & reimbursement',
        prompt: 'How do I submit expenses for reimbursement?',
      },
      {
        title: 'What does the code of conduct say?',
        label: 'conduct & ethics',
        prompt: 'Can you summarise the company code of conduct?',
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
  const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>([])

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
            streamChat={wsChatStream}
            onMessagesChange={onMessagesChange}
          >
            <ThreadWithSuggestions />
          </ChatRuntimeProvider>
        </div>
      </div>
    </div>
  )
}
