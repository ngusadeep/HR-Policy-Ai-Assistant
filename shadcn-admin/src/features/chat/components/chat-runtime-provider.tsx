'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
  AssistantRuntimeProvider,
} from '@assistant-ui/react'
import {
  getFakeResponse,
  streamFakeResponse,
} from '@/features/chat/data/fake-chat-data'

export type MyMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/** Optional: provide a stream function to wire your API. If not provided, fake static responses are used. */
export type ChatStreamFn = (params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}) => AsyncGenerator<string, void, unknown>

const generateId = () => Math.random().toString(36).substring(2, 9)

const convertMessage = (message: MyMessage): ThreadMessageLike => {
  return {
    id: message.id,
    role: message.role,
    content: [{ type: 'text', text: message.content }],
  }
}

/** Static fake stream: HR-themed canned responses, simulated streaming. */
async function* fakeStream(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}): AsyncGenerator<string> {
  const { messages } = params
  const last = messages[messages.length - 1]
  if (last?.role !== 'user') return
  const response = getFakeResponse(last.content)
  yield* streamFakeResponse(response, 12)
}

const TITLE_MAX = 48
const PREVIEW_MAX = 64

export function getThreadSummary(messages: MyMessage[]): { title: string; preview: string } {
  const firstUser = messages.find((m) => m.role === 'user')
  const last = messages[messages.length - 1]
  const title = firstUser?.content?.trim().slice(0, TITLE_MAX) || 'New chat'
  const preview = last?.content?.trim().slice(0, PREVIEW_MAX) || ''
  return {
    title: title + (firstUser && firstUser.content.length > TITLE_MAX ? '…' : ''),
    preview: preview + (last && last.content.length > PREVIEW_MAX ? '…' : ''),
  }
}

export function ChatRuntimeProvider({
  children,
  streamChat,
  onMessagesChange,
}: Readonly<{
  children: ReactNode
  /** Wire your chat API here. If omitted, static fake HR-themed responses are used. */
  streamChat?: ChatStreamFn
  /** Called whenever messages change (so parent can show current chat in history). */
  onMessagesChange?: (messages: MyMessage[]) => void
}>) {
  const [isRunning, setIsRunning] = useState(false)
  const [messages, setMessages] = useState<MyMessage[]>([])

  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  const onNew = async (message: AppendMessage) => {
    if (message.content[0]?.type !== 'text')
      throw new Error('Only text messages are supported')

    const input = message.content[0].text
    const userMessage: MyMessage = {
      id: generateId(),
      role: 'user',
      content: input,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    setIsRunning(true)
    const assistantId = generateId()
    const assistantMessage: MyMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const stream = streamChat ?? fakeStream
      const streamIterator = stream({
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })

      for await (const chunk of streamIterator) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, an error occurred. Please try again.' }
            : m
        )
      )
    } finally {
      setIsRunning(false)
    }
  }

  /** Edit a user message and resend: replace that message and remove all messages after it, then stream new assistant reply. */
  const onEdit = async (message: AppendMessage) => {
    if (message.content[0]?.type !== 'text')
      throw new Error('Only text messages are supported')

    const input = message.content[0].text
    // sourceId = id of the message being edited (preferred). parentId = id of message before the one we edit (fallback).
    const editIndex =
      'sourceId' in message && message.sourceId != null
        ? messages.findIndex((m) => m.id === message.sourceId)
        : messages.findIndex((m) => m.id === message.parentId) + 1

    if (editIndex < 0) {
      console.warn('Edit: could not find message to edit, falling back to append')
      return onNew(message)
    }

    const kept = messages.slice(0, editIndex)
    const editedUserMessage: MyMessage = {
      id: generateId(),
      role: 'user',
      content: input,
    }
    const updatedMessages = [...kept, editedUserMessage]

    setMessages(updatedMessages)
    setIsRunning(true)
    const assistantId = generateId()
    const assistantMessage: MyMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const stream = streamChat ?? fakeStream
      const streamIterator = stream({
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })

      for await (const chunk of streamIterator) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, an error occurred. Please try again.' }
            : m
        )
      )
    } finally {
      setIsRunning(false)
    }
  }

  /** Resend: remove the assistant reply after the given user message and stream a new response. */
  const onReload = async (parentId: string | null) => {
    if (parentId == null) return
    const parentIndex = messages.findIndex((m) => m.id === parentId)
    if (parentIndex < 0) return
    // Keep messages up to and including the user message; drop the assistant reply (and any after).
    const kept = messages.slice(0, parentIndex + 1)
    const lastUser = kept[kept.length - 1]
    if (lastUser?.role !== 'user') return

    setMessages(kept)
    setIsRunning(true)
    const assistantId = generateId()
    const assistantMessage: MyMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const stream = streamChat ?? fakeStream
      const streamIterator = stream({
        messages: kept.map((m) => ({ role: m.role, content: m.content })),
      })
      for await (const chunk of streamIterator) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, an error occurred. Please try again.' }
            : m
        )
      )
    } finally {
      setIsRunning(false)
    }
  }

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    setMessages: (next) => setMessages([...next]),
    convertMessage,
    onNew,
    onEdit,
    onReload,
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
  )
}
