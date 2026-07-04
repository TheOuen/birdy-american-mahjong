import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Blog' }
export const revalidate = 300

type PostListItem = {
  slug: string
  title: string
  excerpt: string
  published_at: string | null
}

async function getPosts(): Promise<PostListItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('posts')
      .select('slug, title, excerpt, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
    if (error) return []
    return (data ?? []) as PostListItem[]
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="display-xl text-[var(--accent-gold)]">From the table</h1>
        <p className="lede">
          Notes from Andrew - mahjong nights, new arrivals, and what&apos;s
          happening around the London tables.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-lg text-[var(--text-secondary)]">
          Nothing here just yet - the first post is being written. In the
          meantime, the{' '}
          <Link href="/discover" className="text-[var(--accent-gold)] underline underline-offset-2">
            Discover page
          </Link>{' '}
          has our favourite mahjong reading.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="tile-frame tile-lift tile-edge-periwinkle block"
            >
              <div className="tile-face bg-[var(--bg-elevated)] p-6 flex flex-col gap-2">
                {p.published_at && (
                  <time className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-warm)]">
                    {new Date(p.published_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                )}
                <h2 className="display-md text-[var(--text-primary)]">{p.title}</h2>
                {p.excerpt && <p className="text-lg text-[var(--text-secondary)]">{p.excerpt}</p>}
                <span className="link-arrow text-base">
                  Read on <span aria-hidden="true">&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
