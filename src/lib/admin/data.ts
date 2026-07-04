import { createAuthedServerClient } from '@/lib/supabase/server'

type AuthedClient = Awaited<ReturnType<typeof createAuthedServerClient>>

export type AdminQueryResult<T> = {
  rows: T[]
  /** True when the database is unreachable/unconfigured - pages render a friendly notice. */
  offline: boolean
}

// Admin pages read through the signed-in user's client so RLS admin policies
// are the enforcement layer. Any failure (no Supabase project, network down,
// missing table) degrades to an 'offline' result instead of a crashed page.
export async function adminQuery<T>(
  run: (supabase: AuthedClient) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<AdminQueryResult<T>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { rows: [], offline: true }
  try {
    const supabase = await createAuthedServerClient()
    const { data, error } = await run(supabase)
    if (error) {
      console.error('admin query failed:', error.message)
      return { rows: [], offline: true }
    }
    return { rows: data ?? [], offline: false }
  } catch (e) {
    console.error('admin query threw:', e)
    return { rows: [], offline: true }
  }
}
