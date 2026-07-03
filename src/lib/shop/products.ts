import { createServerClient } from '@/lib/supabase/server'
import type { Product } from './types'

export async function getProducts(): Promise<Product[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('type', { ascending: true }) // 'lesson' sorts before 'physical' → lessons first
    .order('price_pence', { ascending: false })
  if (error) throw new Error(`Failed to load products: ${error.message}`)
  return (data ?? []) as Product[]
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (error) throw new Error(`Failed to load product: ${error.message}`)
  return (data as Product | null) ?? null
}
