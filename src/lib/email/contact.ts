// Contact-form topics and validation. Client-safe (no server-only imports):
// the form, the API route, and the admin inbox all share these definitions.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const CONTACT_TOPICS = {
  lessons: 'Lessons',
  shop: 'Shop & orders',
  game: 'Playing online',
  general: 'Something else',
} as const

export type ContactTopic = keyof typeof CONTACT_TOPICS

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === 'string' && value in CONTACT_TOPICS
}

export type ContactSubmission = { name: string; email: string; message: string; topic: ContactTopic }

export function validateContact(body: unknown): ContactSubmission | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || typeof b.email !== 'string' || typeof b.message !== 'string') return null
  const name = b.name.trim()
  const email = b.email.trim()
  const message = b.message.trim()
  if (!name || name.length > 200) return null
  if (!EMAIL_RE.test(email) || email.length > 320) return null
  if (!message || message.length > 5000) return null
  // Older clients (or bots) may omit the topic - default rather than reject.
  const topic: ContactTopic = isContactTopic(b.topic) ? b.topic : 'general'
  return { name, email, message, topic }
}
