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
import { fetchChatSessions, fetchSessionMessages } from './api/chat-api'
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

  // threadKey forces a full remount of ChatRuntimeProvider when switching threads
  const [threadKey, setThreadKey] = useState(0)
  const [currentMessages, setCurrentMessages] = useState<MyMessage[]>([])
  const [initialMessages, setInitialMessages] = useState<MyMessage[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()

  // Persisted sessions loaded from the backend
  const [persistedSessions, setPersistedSessions] = useState<ChatHistoryItem[]>([])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Load session list from backend on mount
  useEffect(() => {
    fetchChatSessions()
      .then(setPersistedSessions)
      .catch(() => {/* silently ignore if not authenticated yet */})
  }, [])

  const onMessagesChange = useCallback((messages: MyMessage[]) => {
    setCurrentMessages(messages)
  }, [])

  const startNewThread = useCallback(() => {
    setActiveSessionId(undefined)
    setInitialMessages([])
    setThreadKey((k) => k + 1)
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const handleSelectSession = useCallback(async (item: ChatHistoryItem) => {
    if (item.id === activeSessionId) return
    try {
      const messages = await fetchSessionMessages(item.id)
      setActiveSessionId(item.id)
      setInitialMessages(messages)
      setThreadKey((k) => k + 1)
      if (isMobile) setSidebarOpen(false)
    } catch {
      // If fetching fails, just start fresh
      startNewThread()
    }
  }, [activeSessionId, isMobile, startNewThread])

  // The sidebar list: current active thread (if it has messages) + persisted sessions
  const sidebarItems = useMemo((): ChatHistoryItem[] => {
    // Build an entry for the active unsaved thread (messages not yet in backend)
    const activeEntry: ChatHistoryItem | null =
      currentMessages.length > 0 && !activeSessionId
        ? (() => {
            const { title, preview } = getThreadSummary(currentMessages)
            return { id: 'current', title, preview, updatedAt: new Date() }
          })()
        : null

    const persisted = persistedSessions.filter((s) => s.id !== activeSessionId)

    return [
      ...(activeEntry ? [activeEntry] : []),
      ...persisted,
    ]
  }, [currentMessages, activeSessionId, persistedSessions])

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
        activeId={activeSessionId ?? (currentMessages.length > 0 ? 'current' : undefined)}
        onSelect={handleSelectSession}
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
            initialMessages={initialMessages}
          >
            <ThreadWithSuggestions />
          </ChatRuntimeProvider>
        </div>
      </div>
    </div>
  )
}
