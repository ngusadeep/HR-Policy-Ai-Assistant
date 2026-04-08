import { api } from '@/lib/api'
import type { DocStatus } from '@/features/documents/data/schema'

interface ApiEnvelope<T> {
  data: T
}

export interface RecentDocumentItem {
  id: number
  name: string
  status: DocStatus
  chunkCount: number
  uploadedBy: string | null
  uploadedAt: string
}

export interface RecentQueryItem {
  sessionId: string
  question: string
  askedAt: string
}

export interface DashboardStats {
  documentCount: number
  indexedDocumentCount: number
  queryThisMonth: number
  activeUserCount: number
  recentDocuments: RecentDocumentItem[]
  recentQueries: RecentQueryItem[]
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<ApiEnvelope<DashboardStats>>('/analytics/stats')
  return data.data
}
