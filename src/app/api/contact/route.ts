import { NextResponse } from 'next/server'
import { sendEmail, NOTIFY_EMAIL } from '@/lib/email/send'
import { validateContact, CONTACT_TOPICS } from '@/lib/email/contact'
import { createServiceClient } from '@/lib/supabase/server'

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

  // Store in the admin inbox first (best-effort - the email below is the
  // primary notification; a DB outage must not block the message).
  try {
    const supabase = createServiceClient()
    await supabase.from('contact_messages').insert({
      name: submission.name,
      email: submission.email,
      message: submission.message,
      topic: submission.topic,
    })
  } catch (e) {
    console.error('contact message store failed', e)
  }

  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      subject: `Website enquiry (${CONTACT_TOPICS[submission.topic]}) from ${submission.name}`,
      text: `Name: ${submission.name}\nEmail: ${submission.email}\nTopic: ${CONTACT_TOPICS[submission.topic]}\n\n${submission.message}`,
      replyTo: submission.email,
    })
  } catch (e) {
    console.error('contact form send failed', e)
    return NextResponse.json({ error: 'Sorry, we could not send your message. Please email us directly.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
