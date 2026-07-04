import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export const revalidate = 300

type PostDetail = {
  slug: string
  title: string
  body: string
  published_at: string | null
}

async function getPost(slug: string): Promise<PostDetail | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('posts')
      .select('slug, title, body, published_at')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
    if (error) return null
    return (data as PostDetail | null) ?? null
  } catch {
    return null
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  // Body is plain text authored in the admin panel; blank lines separate paragraphs.
  const paragraphs = post.body.split(/\n\s*\n/).filter(Boolean)

  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col gap-6">
      <Link href="/blog" className="link-arrow text-base">
        <span aria-hidden="true">&larr;</span> All posts
      </Link>
      {post.published_at && (
        <time className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-warm)]">
          {new Date(post.published_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      )}
      <h1 className="display-xl text-[var(--text-primary)]">{post.title}</h1>
      <div className="flex flex-col gap-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-lg leading-relaxed text-[var(--text-secondary)]">
            {p}
          </p>
        ))}
      </div>
      <div className="mt-6 rounded-[var(--radius-lg)] bg-[var(--accent-lavender)] p-6 flex flex-col gap-3">
        <p className="text-lg text-[var(--text-primary)] font-semibold">
          Fancy a game after reading?
        </p>
        <Link href="/lobby" className="btn-primary text-lg self-start px-8">
          Play Birdy free
        </Link>
      </div>
    </article>
  )
}
