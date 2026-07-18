import Link from 'next/link'
import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { CONTACT_TOPICS, isContactTopic, type ContactTopic } from '@/lib/email/contact'
import { setMessageStatus } from '../actions'

export const metadata = { title: 'Messages - Admin' }
export const dynamic = 'force-dynamic'

type MessageRow = {
  id: string
  created_at: string
  name: string
  email: string
  message: string
  topic: ContactTopic | null
  status: 'new' | 'read' | 'replied'
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const { topic } = await searchParams
  const activeTopic = isContactTopic(topic) ? topic : null

  const { rows: allMessages, offline } = await adminQuery<MessageRow>((sb) =>
    sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
  )
  const messages = activeTopic ? allMessages.filter((m) => (m.topic ?? 'general') === activeTopic) : allMessages

  const topicCount = (t: ContactTopic) => allMessages.filter((m) => (m.topic ?? 'general') === t).length

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Contact messages
      </h1>

      {offline && <OfflineBanner thing="messages" />}

      {/* Topic filter - one chip per kind of enquiry the site invites */}
      {allMessages.length > 0 && (
        <nav aria-label="Filter by topic" className="flex flex-wrap gap-2">
          <Link
            href="/admin/messages"
            className={`px-4 py-2 rounded-full text-base font-semibold transition-colors ${
              activeTopic === null
                ? 'bg-[var(--brand)] text-[var(--text-inverse)]'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--accent-lavender)]'
            }`}
          >
            All ({allMessages.length})
          </Link>
          {(Object.entries(CONTACT_TOPICS) as [ContactTopic, string][]).map(([value, label]) => (
            <Link
              key={value}
              href={`/admin/messages?topic=${value}`}
              className={`px-4 py-2 rounded-full text-base font-semibold transition-colors ${
                activeTopic === value
                  ? 'bg-[var(--brand)] text-[var(--text-inverse)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--accent-lavender)]'
              }`}
            >
              {label} ({topicCount(value)})
            </Link>
          ))}
        </nav>
      )}

      {!offline && allMessages.length === 0 && (
        <p className="text-lg text-[var(--text-secondary)]">
          Nothing yet - contact-form submissions land here (and in the notification email).
        </p>
      )}

      {!offline && allMessages.length > 0 && messages.length === 0 && (
        <p className="text-lg text-[var(--text-secondary)]">
          No messages about {activeTopic ? CONTACT_TOPICS[activeTopic].toLowerCase() : 'this'} yet.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {messages.map((m) => (
          <article
            key={m.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex flex-col gap-3"
          >
            <header className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{m.name}</p>
                <a href={`mailto:${m.email}`} className="text-base text-[var(--accent-gold)] underline underline-offset-2">
                  {m.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded-sm text-sm font-semibold bg-[var(--bg-card)] text-[var(--text-secondary)]">
                  {CONTACT_TOPICS[m.topic ?? 'general']}
                </span>
                <span
                  className={`px-2 py-1 rounded-sm text-sm font-semibold ${
                    m.status === 'new'
                      ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                      : m.status === 'read'
                        ? 'bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)]'
                        : 'bg-[var(--success-light)] text-[var(--success)]'
                  }`}
                >
                  {m.status}
                </span>
                <time className="text-sm text-[var(--text-muted)]">
                  {new Date(m.created_at).toLocaleString('en-GB')}
                </time>
              </div>
            </header>
            <p className="text-base leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">{m.message}</p>
            <footer className="flex gap-2">
              {m.status === 'new' && (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value="read" />
                  <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--accent-lavender)] transition-colors">
                    Mark read
                  </button>
                </form>
              )}
              {m.status !== 'replied' && (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value="replied" />
                  <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] transition-colors">
                    Mark replied
                  </button>
                </form>
              )}
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to American Mahjong London')}`}
                className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--accent-warm)] text-[var(--text-inverse)] hover:bg-[var(--accent-warm-light)] transition-colors"
              >
                Reply by email
              </a>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
