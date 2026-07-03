import { createServerClient } from '@/lib/supabase/server'
import type { Product } from './types'

// The real AML catalog, verbatim from the Squarespace store and the 002_shop
// seed. Used as a fallback so the shop and homepage look complete before
// Supabase is connected. Once the DB has products, live data takes over.
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'fallback-beginner-individual',
    slug: 'beginner-individual-session',
    name: 'Beginner Individual Session (2.5 Hours)',
    description:
      "New to Mahjong? Our Beginner Session is the perfect place to start. Learn the tiles, the rules, and how to build winning hands — at your own pace. You'll leave with a complete guide to take home and return to anytime.",
    price_pence: 25000,
    type: 'lesson',
    image: '/aml/lesson-beginner.png',
    active: true,
  },
  {
    id: 'fallback-beginner-group',
    slug: 'beginner-group-session',
    name: 'Beginner Group Session (2.5 Hours, per person)',
    description:
      'Learn everything you need to know to play American Mahjong from scratch, in a group of 2, 3, or 4. Cover the tiles, the rules, and winning hand construction at your own pace, and leave with a complete guide to take home.',
    price_pence: 15000,
    type: 'lesson',
    image: '/aml/lesson-individual.png',
    active: true,
  },
  {
    id: 'fallback-private-1-hour',
    slug: 'private-session-1-hour',
    name: 'Private Session (1 Hour)',
    description:
      'Already know American Mahjong? This session is designed for you. Refresh your knowledge of the rules and etiquette, keep building on your game, and pick up advanced strategy, gameplay and tips to take your game to the next level.',
    price_pence: 12500,
    type: 'lesson',
    image: '/aml/lesson-1-hour.png',
    active: true,
  },
  {
    id: 'fallback-nmjl-card-2026',
    slug: 'nmjl-card-2026',
    name: '2026 Official NMJL Card (Large Print)',
    description:
      "The official 2026 National Mah Jongg League card, large print edition, imported from the US. Released every April with the year's official winning hands — required to play American Mahjong.",
    price_pence: 1500,
    type: 'physical',
    image: '/aml/nmjl-card-2026.png',
    active: true,
  },
  {
    id: 'fallback-scorecard-notepad',
    slug: 'scorecard-notepad',
    name: 'American Mahjong Scorecard Notepad (A5, 50 pages)',
    description:
      'Keep scoring simple. A5 notepad with 50 tear-off scorecard pages, designed for American Mahjong.',
    price_pence: 1000,
    type: 'physical',
    image: '/aml/scorecard-notepad.png',
    active: true,
  },
]

// Match getProducts' ordering: lessons first, then by price descending.
function sortedFallback(): Product[] {
  return [...FALLBACK_PRODUCTS].sort(
    (a, b) => a.type.localeCompare(b.type) || b.price_pence - a.price_pence
  )
}

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
  if (!supabaseConfigured()) return sortedFallback()
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
      return sortedFallback()
    }
    // Empty table (migration not seeded yet) also falls back to the known catalog.
    return data && data.length > 0 ? (data as Product[]) : sortedFallback()
  } catch (e) {
    console.error('getProducts failed', e)
    return sortedFallback()
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  const fromFallback = () => FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null
  if (!supabaseConfigured()) return fromFallback()
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
      return fromFallback()
    }
    return (data as Product | null) ?? fromFallback()
  } catch (e) {
    console.error('getProduct failed', e)
    return fromFallback()
  }
}
