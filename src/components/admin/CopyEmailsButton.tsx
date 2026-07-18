'use client'

import { useState } from 'react'

type CopyEmailsButtonProps = {
  emails: string[]
}

export function CopyEmailsButton({ emails }: CopyEmailsButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emails.join(', '))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) - nothing to do; the
      // addresses are all visible on the page to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={emails.length === 0}
      className="btn-secondary text-base px-6 disabled:opacity-50"
    >
      {copied ? 'Copied!' : 'Copy all email addresses'}
    </button>
  )
}
