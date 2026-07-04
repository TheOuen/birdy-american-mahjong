'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const data = new FormData(e.currentTarget)
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.get('email') }),
    }).catch(() => null)
    setStatus(res?.ok ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <p role="status" className="rounded-[var(--radius-lg)] bg-[var(--success-light)] text-[var(--success)] px-5 py-4 text-xl">
        You&apos;re on the list - welcome to the table!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        autoComplete="email"
        className="input-elegant flex-1"
      />
      <button type="submit" disabled={status === 'sending'} className="btn-berry px-6 whitespace-nowrap">
        {status === 'sending' ? 'Joining…' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p role="alert" className="text-[var(--error)] text-lg sm:self-center">
          That didn&apos;t go through - please try again.
        </p>
      )}
    </form>
  )
}
