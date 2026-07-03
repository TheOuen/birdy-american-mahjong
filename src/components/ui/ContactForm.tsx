'use client'

import { useState } from 'react'

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
        message: data.get('message'),
        website: data.get('website'),
      }),
    }).catch(() => null)
    if (res?.ok) {
      setStatus('sent')
      form.reset()
    } else {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null
      setErrorMsg(body?.error ?? 'Sorry, we could not send your message. Please email us directly.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p role="status" className="rounded-md bg-[var(--success-light)] text-[var(--success)] px-5 py-4 text-xl">
        Thank you — your message is on its way. Andrew will get back to you soon.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Your name
        <input name="name" required maxLength={200}
          className="h-12 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-lg text-[var(--text-primary)]" />
      </label>
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Your email
        <input name="email" type="email" required maxLength={320}
          className="h-12 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-lg text-[var(--text-primary)]" />
      </label>
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Message
        <textarea name="message" required maxLength={5000} rows={6}
          className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3 text-lg text-[var(--text-primary)]" />
      </label>
      {/* Honeypot — hidden from humans, catnip for bots */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {status === 'error' && (
        <p role="alert" className="rounded-md bg-[var(--error-light)] text-[var(--error)] px-4 py-3 text-lg">{errorMsg}</p>
      )}
      <button type="submit" disabled={status === 'sending'}
        className="h-14 rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)]
          hover:bg-[var(--brand-light)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all duration-150">
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
