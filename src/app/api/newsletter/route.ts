import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const email =
    typeof body === 'object' && body !== null && typeof (body as Record<string, unknown>).email === 'string'
      ? ((body as Record<string, unknown>).email as string).trim()
      : ''
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('newsletter_subscribers').insert({ email })
  if (error && !error.message.includes('duplicate')) {
    console.error('newsletter insert failed', error)
    return NextResponse.json({ error: 'Sorry, something went wrong. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
