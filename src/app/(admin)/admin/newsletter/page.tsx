import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { CopyEmailsButton } from '@/components/admin/CopyEmailsButton'

export const metadata = { title: 'Newsletter - Admin' }
export const dynamic = 'force-dynamic'

type SubscriberRow = {
  id: string
  email: string
  created_at: string
}

export default async function AdminNewsletterPage() {
  const { rows: subscribers, offline } = await adminQuery<SubscriberRow>((sb) =>
    sb.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }).limit(2000)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Newsletter subscribers
        </h1>
        <CopyEmailsButton emails={subscribers.map((s) => s.email)} />
      </div>

      {offline && <OfflineBanner thing="subscribers" />}

      {!offline && (
        <p className="text-lg text-[var(--text-secondary)]">
          {subscribers.length === 0
            ? 'No subscribers yet - signups from the website land here.'
            : `${subscribers.length} ${subscribers.length === 1 ? 'person has' : 'people have'} signed up. Copy the addresses above and paste them into the BCC field of your newsletter email.`}
        </p>
      )}

      {subscribers.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-[var(--border)] max-w-2xl">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <a href={`mailto:${s.email}`} className="text-[var(--accent-gold)] underline underline-offset-2">
                      {s.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--text-muted)]">
                    {new Date(s.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
