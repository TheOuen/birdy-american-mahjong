import Link from 'next/link'
import { createAuthedServerClient } from '@/lib/supabase/server'
import { lessonItems, orderHasLesson } from '@/lib/shop/orders'
import { formatLondon } from '@/lib/shop/bookings'
import type { OrderItem } from '@/lib/shop/checkout'
import { TileMotif } from '@/components/ui/TileMotif'

export const metadata = { title: 'My lessons - American Mahjong | London' }
export const dynamic = 'force-dynamic'

type LessonOrder = {
  id: string
  created_at: string
  items: OrderItem[]
  status: 'new' | 'scheduled' | 'fulfilled'
  scheduled_at: string | null
  admin_note: string | null
}

function lessonName(item: OrderItem): string {
  const words = item.slug.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1) + (item.quantity > 1 ? ` × ${item.quantity}` : '')
}

export default async function MyLessonsPage() {
  const supabase = await createAuthedServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16 flex flex-col items-center gap-6 text-center">
        <span aria-hidden="true">
          <TileMotif variant="dot" className="h-14 w-auto opacity-80" />
        </span>
        <h1 className="display-xl text-[var(--text-primary)]">My lessons</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Sign in with the email address you used at checkout and your lesson bookings will appear
          here, including the date and time once Andrew has scheduled them.
        </p>
        <Link href="/login" className="btn-berry text-xl px-8 h-14 inline-flex items-center">
          Sign in
        </Link>
      </div>
    )
  }

  const { data } = await supabase
    .from('orders')
    .select('id, created_at, items, status, scheduled_at, admin_note')
    .order('created_at', { ascending: false })
  const bookings = ((data ?? []) as LessonOrder[]).filter((o) => orderHasLesson(o.items))

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="display-xl text-[var(--text-primary)]">My lessons</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Lessons booked with {user.email}. Need to change something? Just reply to your booking
          email or <Link href="/get-in-touch" className="underline">get in touch</Link>.
        </p>
      </div>

      {bookings.length === 0 && (
        <div className="card rounded-[var(--radius-tile)] flex flex-col items-center gap-5 py-14 px-6 text-center">
          <div className="flex gap-2 opacity-70" aria-hidden="true">
            <TileMotif variant="dot" className="h-12 w-auto -rotate-6" />
            <TileMotif variant="bam" className="h-12 w-auto rotate-6" />
          </div>
          <p className="display-md text-[var(--text-primary)]">No lessons booked yet</p>
          <p className="text-lg text-[var(--text-secondary)]">
            Learn it once, love it forever - book a lesson with Andrew to get started.
          </p>
          <Link href="/private-lessons" className="btn-primary">
            Browse lessons
          </Link>
        </div>
      )}

      {bookings.map((b) => (
        <section
          key={b.id}
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {lessonItems(b.items).map(lessonName).join(', ')}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                b.status === 'fulfilled'
                  ? 'bg-[var(--success-light)] text-[var(--success)]'
                  : b.status === 'scheduled'
                    ? 'bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)]'
                    : 'bg-[var(--warning-light)] text-[var(--warning)]'
              }`}
            >
              {b.status === 'fulfilled' ? 'Completed' : b.status === 'scheduled' ? 'Scheduled' : 'Being arranged'}
            </span>
          </div>

          {b.status === 'scheduled' && b.scheduled_at ? (
            <p className="text-lg font-semibold text-[var(--accent-warm)]">
              {formatLondon(b.scheduled_at)}
            </p>
          ) : b.status === 'new' ? (
            <p className="text-base text-[var(--text-secondary)]">
              Andrew will email you shortly to arrange a time that suits you.
            </p>
          ) : null}

          {b.admin_note && (
            <p className="rounded-[var(--radius-lg)] bg-[var(--accent-jade-subtle)] px-4 py-3 text-base text-[var(--accent-jade-dark)]">
              {b.admin_note}
            </p>
          )}

          <p className="text-sm text-[var(--text-muted)]">
            Booked {new Date(b.created_at).toLocaleDateString('en-GB')}
          </p>
        </section>
      ))}
    </div>
  )
}
