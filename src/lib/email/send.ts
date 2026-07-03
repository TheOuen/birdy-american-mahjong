export const NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL ?? 'hello@americanmahjonglondon.com'

const FROM = 'American Mahjong London <onboarding@resend.dev>'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SendEmailOptions = { to: string; subject: string; text: string; replyTo?: string }

export async function sendEmail({ to, subject, text, replyTo }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`)
  }
}

export type ContactSubmission = { name: string; email: string; message: string }

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
  return { name, email, message }
}
