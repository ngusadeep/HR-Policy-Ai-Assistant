import { api } from '@/lib/api'
import { documentSchema, type PolicyDocument } from '../data/schema'

interface ApiEnvelope<T> {
  data: T
}

export async function fetchDocuments(): Promise<PolicyDocument[]> {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/documents')
  return data.data.map((d) => documentSchema.parse(d))
}

export async function uploadDocument(
  file: File,
  collection = 'hr_policies',
): Promise<PolicyDocument> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<ApiEnvelope<unknown>>(
    `/documents/upload?collection=${encodeURIComponent(collection)}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return documentSchema.parse(data.data)
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`)
}

export async function deleteDocuments(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteDocument(id)))
}
