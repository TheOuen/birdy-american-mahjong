'use client'

import { useState } from 'react'
import { CONTACT_TOPICS } from '@/lib/email/contact'

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const data = new FormData(form)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        email: data.get('email'),
        topic: data.get('topic'),
        message: data.get('message'),
        website: data.get('website'),
      }),
    }).catch(() => null)
    if (res?.ok) {
      setStatus('sent')
      form.reset()
    } else {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null
      setErrorMsg(body?.error ?? 'Your message could not be sent. Please email hello@americanmahjonglondon.com directly.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p role="status" className="rounded-[var(--radius-lg)] bg-[var(--success-light)] text-[var(--success)] px-5 py-4 text-xl">
        Thank you - your message is on its way. Andrew will get back to you soon.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Your name
        <input name="name" required maxLength={200} autoComplete="name" className="input-elegant" />
      </label>
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Your email
        <input name="email" type="email" required maxLength={320} autoComplete="email" className="input-elegant" />
      </label>
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        What is it about?
        <select name="topic" defaultValue="general" className="input-elegant">
          {Object.entries(CONTACT_TOPICS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Message
        <textarea name="message" required maxLength={5000} rows={6} className="input-elegant" />
      </label>
      {/* Honeypot - hidden from humans, catnip for bots */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {status === 'error' && (
        <p role="alert" className="rounded-[var(--radius-lg)] bg-[var(--error-light)] text-[var(--error)] px-4 py-3 text-lg">
          {errorMsg}
        </p>
      )}
      <button type="submit" disabled={status === 'sending'} className="btn-berry text-xl h-14">
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
