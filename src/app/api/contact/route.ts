import { NextResponse } from 'next/server'
import { sendEmail, validateContact, NOTIFY_EMAIL } from '@/lib/email/send'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot: bots fill every field; humans never see this one.
  if (typeof body === 'object' && body !== null && (body as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true })
  }

  const submission = validateContact(body)
  if (!submission) {
    return NextResponse.json({ error: 'Please fill in your name, a valid email, and a message.' }, { status: 400 })
  }

  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      subject: `Website enquiry from ${submission.name}`,
      text: `Name: ${submission.name}\nEmail: ${submission.email}\n\n${submission.message}`,
      replyTo: submission.email,
    })
  } catch (e) {
    console.error('contact form send failed', e)
    return NextResponse.json({ error: 'Sorry, we could not send your message. Please email us directly.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
