/**
 * Static fake data for chat demo (no backend).
 * Replace with real API / persistence when wiring production.
 */

export type ChatHistoryItem = {
  id: string
  title: string
  preview?: string
  updatedAt?: Date
}

const FAKE_RESPONSES: string[] = [
  `Our **leave policy** allows up to 25 days of annual leave per year for full-time employees. Unused leave can be carried over to the next year (max 5 days) with manager approval. Please submit requests through the HR portal at least 2 weeks in advance.`,
  `**Remote work** is available up to 2 days per week for eligible roles. You’ll need to complete the flexible working request form and have it approved by your line manager. Equipment guidelines are in the handbook.`,
  `The **code of conduct** requires professional behaviour, respect for colleagues, and compliance with all company policies. Breaches may result in disciplinary action. Full details are in the employee handbook, Section 3.`,
  `**Training** opportunities are listed in the learning portal. Mandatory training (safety, compliance) must be completed within 30 days of joining. Your manager can approve additional courses.`,
  `For **expenses**, use the company card or submit receipts via the expenses app within 30 days. Keep amounts under the limits in the travel policy. Reimbursement usually takes 5–7 working days.`,
  `I’m the HR Policy Assistant. I can help with leave, remote work, conduct, training, expenses, and other policy questions. What would you like to know?`,
]

/** Picks a fake response by simple keyword match, otherwise returns a random one. */
export function getFakeResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  if (lower.includes('leave') || lower.includes('vacation') || lower.includes('holiday'))
    return FAKE_RESPONSES[0]
  if (lower.includes('remote') || lower.includes('work from home') || lower.includes('wfh'))
    return FAKE_RESPONSES[1]
  if (lower.includes('conduct') || lower.includes('behavior') || lower.includes('policy'))
    return FAKE_RESPONSES[2]
  if (lower.includes('training') || lower.includes('learning') || lower.includes('course'))
    return FAKE_RESPONSES[3]
  if (lower.includes('expense') || lower.includes('reimburse') || lower.includes('travel'))
    return FAKE_RESPONSES[4]
  const idx = Math.floor(Math.random() * FAKE_RESPONSES.length)
  return FAKE_RESPONSES[idx]
}

/** Simulates streaming by yielding the response character by character. */
export async function* streamFakeResponse(
  response: string,
  delayMs = 15
): AsyncGenerator<string> {
  for (const char of response) {
    await new Promise((r) => setTimeout(r, delayMs))
    yield char
  }
}

/** Static fake chat history for sidebar and search modal. */
export const FAKE_CHAT_HISTORY: ChatHistoryItem[] = [
  {
    id: 'fake-1',
    title: 'Leave policy question',
    preview: 'How many days of annual leave do I get?',
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'fake-2',
    title: 'Remote work request',
    preview: 'Can I work from home twice a week?',
    updatedAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'fake-3',
    title: 'Expenses and reimbursement',
    preview: 'How do I submit travel expenses?',
    updatedAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'fake-4',
    title: 'Code of conduct',
    preview: 'Where can I find the full conduct policy?',
    updatedAt: new Date(Date.now() - 86400000 * 10),
  },
  {
    id: 'fake-5',
    title: 'Training and development',
    preview: 'How do I sign up for mandatory training?',
    updatedAt: new Date(Date.now() - 86400000 * 14),
  },
]
