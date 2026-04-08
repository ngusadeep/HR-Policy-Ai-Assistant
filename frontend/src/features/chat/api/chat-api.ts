import { api } from '@/lib/api'
import type { MyMessage } from '../components/chat-runtime-provider'
import type { ChatHistoryItem } from '../data/chat-types'

interface ApiEnvelope<T> {
  data: T
}

interface SessionSummary {
  id: string
  collection: string
  createdAt: string
  updatedAt: string
  firstQuestion: string | null
  messageCount: number
}

interface MessageDto {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export async function fetchChatSessions(): Promise<ChatHistoryItem[]> {
  const { data } = await api.get<ApiEnvelope<SessionSummary[]>>('/chat/sessions')
  return data.data.map((s) => ({
    id: s.id,
    title: s.firstQuestion?.slice(0, 48) ?? 'Chat session',
    preview: s.firstQuestion ?? undefined,
    updatedAt: new Date(s.updatedAt),
  }))
}

export async function fetchSessionMessages(sessionId: string): Promise<MyMessage[]> {
  const { data } = await api.get<ApiEnvelope<MessageDto[]>>(
    `/chat/sessions/${sessionId}/messages`
  )
  return data.data.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }))
}
