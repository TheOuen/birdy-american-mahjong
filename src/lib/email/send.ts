export const NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL ?? 'hello@americanmahjonglondon.com'

const FROM = 'American Mahjong London <onboarding@resend.dev>'

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

