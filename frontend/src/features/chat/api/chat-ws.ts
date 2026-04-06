import { getCookie } from '@/lib/cookies'
import type { ChatStreamFn } from '../components/chat-runtime-provider'

/** Derive WebSocket base URL from the HTTP API URL: http(s) → ws(s), strip the path. */
function getWsBase(): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
  const { protocol, host } = new URL(apiUrl)
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${host}`
}

const WS_URL = getWsBase()
const ACCESS_TOKEN_KEY = 'hr_access_token'

function getToken(): string {
  const raw = getCookie(ACCESS_TOKEN_KEY)
  if (!raw) return ''
  try {
    return JSON.parse(raw) as string
  } catch {
    return raw
  }
}

/**
 * ChatStreamFn implementation that connects to the NestJS WebSocket gateway,
 * sends the message history, and yields tokens as they arrive.
 *
 * Usage: pass this as the `streamChat` prop of <ChatRuntimeProvider>.
 */
export const wsChatStream: ChatStreamFn = async function* ({ messages }) {
  const token = getToken()
  const url = `${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`
  const sessionId = crypto.randomUUID()

  const ws = new WebSocket(url)

  // Wait for the connection to open
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve()
    ws.onerror = () => reject(new Error('WebSocket connection failed'))
    ws.onclose = (e) => {
      if (e.code === 4001) reject(new Error('Unauthorized — please sign in again.'))
    }
  })

  // Send the query
  ws.send(
    JSON.stringify({
      event: 'query',
      data: { sessionId, messages, collection: 'hr_policies' },
    }),
  )

  // Stream tokens via an async generator backed by a queue
  const queue: string[] = []
  let done = false
  let error: string | null = null
  let resolve: (() => void) | null = null

  ws.onmessage = (event: MessageEvent<string>) => {
    type ServerEvent =
      | { type: 'token'; text: string }
      | { type: 'sources' }
      | { type: 'done' }
      | { type: 'error'; message: string }

    let msg: ServerEvent
    try {
      msg = JSON.parse(event.data) as ServerEvent
    } catch {
      return
    }

    if (msg.type === 'token') {
      queue.push(msg.text)
      resolve?.()
      resolve = null
    } else if (msg.type === 'done') {
      done = true
      resolve?.()
      resolve = null
    } else if (msg.type === 'error') {
      error = msg.message
      done = true
      resolve?.()
      resolve = null
    }
    // sources event is informational — could be exposed later
  }

  ws.onclose = () => {
    done = true
    resolve?.()
    resolve = null
  }

  try {
    while (true) {
      // Drain the queue first
      while (queue.length > 0) {
        yield queue.shift()!
      }
      if (done) break
      // Wait for the next message
      await new Promise<void>((r) => { resolve = r })
    }

    if (error) throw new Error(error)
  } finally {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
  }
}
