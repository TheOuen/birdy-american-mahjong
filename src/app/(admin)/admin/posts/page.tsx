import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { createPost, setPostPublished, deletePost } from '../actions'

export const metadata = { title: 'Posts - Admin' }
export const dynamic = 'force-dynamic'

type PostRow = {
  id: string
  created_at: string
  slug: string
  title: string
  excerpt: string
  published: boolean
  published_at: string | null
}

export default async function AdminPostsPage() {
  const { rows: posts, offline } = await adminQuery<PostRow>((sb) =>
    sb.from('posts').select('id, created_at, slug, title, excerpt, published, published_at').order('created_at', { ascending: false })
  )

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Blog posts
      </h1>

      {offline && <OfflineBanner thing="posts" />}

      {/* New post */}
      <form
        action={createPost}
        className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-4 max-w-2xl"
      >
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Write a post</h2>
        <label className="flex flex-col gap-1.5 text-base font-medium text-[var(--text-primary)]">
          Title
          <input name="title" required maxLength={140} className="input-elegant" placeholder="Why mahjong nights are back" />
        </label>
        <label className="flex flex-col gap-1.5 text-base font-medium text-[var(--text-primary)]">
          Excerpt <span className="font-normal text-[var(--text-muted)]">(one or two sentences for the listing)</span>
          <input name="excerpt" maxLength={280} className="input-elegant" />
        </label>
        <label className="flex flex-col gap-1.5 text-base font-medium text-[var(--text-primary)]">
          Body
          <textarea name="body" required rows={8} className="input-elegant" style={{ minHeight: '10rem' }} placeholder="Write naturally - paragraphs separated by a blank line." />
        </label>
        <button className="btn-primary text-base self-start px-8">Save draft</button>
        <p className="text-sm text-[var(--text-muted)]">Drafts stay private until you publish them.</p>
      </form>

      {/* Existing posts */}
      <div className="flex flex-col gap-3">
        {posts.map((p) => (
          <div
            key={p.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="min-w-0">
              <p className="text-lg font-bold text-[var(--text-primary)]">{p.title}</p>
              <p className="text-sm text-[var(--text-muted)]">
                /blog/{p.slug} &middot; {new Date(p.created_at).toLocaleDateString('en-GB')}
                {p.published ? ' · live' : ' · draft'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {p.published ? (
                <>
                  <a
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)]"
                  >
                    View
                  </a>
                  <form action={setPostPublished}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="publish" value="false" />
                    <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--bg-card)] text-[var(--text-primary)]">
                      Unpublish
                    </button>
                  </form>
                </>
              ) : (
                <form action={setPostPublished}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="publish" value="true" />
                  <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--success-light)] text-[var(--success)]">
                    Publish
                  </button>
                </form>
              )}
              <form action={deletePost}>
                <input type="hidden" name="id" value={p.id} />
                <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--error-light)] text-[var(--error)]">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
