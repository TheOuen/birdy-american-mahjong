import { createServerClient } from '@/lib/supabase/server'
import type { Product } from './types'

// True only when Supabase is actually configured. Without it, the catalog
// helpers degrade to "no products" instead of throwing — so the marketing
// site (home, shop, lessons) still builds and renders. Wire up Supabase and
// the catalog populates on the next revalidation.
function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function getProducts(): Promise<Product[]> {
  if (!supabaseConfigured()) return []
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('type', { ascending: true }) // 'lesson' sorts before 'physical' → lessons first
      .order('price_pence', { ascending: false })
    if (error) {
      console.error(`Failed to load products: ${error.message}`)
      return []
    }
    return (data ?? []) as Product[]
  } catch (e) {
    console.error('getProducts failed', e)
    return []
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!supabaseConfigured()) return null
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
    if (error) {
      console.error(`Failed to load product: ${error.message}`)
      return null
    }
    return (data as Product | null) ?? null
  } catch (e) {
    console.error('getProduct failed', e)
    return null
  }
}
