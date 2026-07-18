'use server'

// Admin mutations. All writes go through the signed-in user's client so the
// RLS admin policies (003_admin.sql) are the enforcement layer - the layout's
// role gate is UX, the database is the guarantee. Failures log and fall
// through to revalidation; the page's offline banner explains the state.

import { revalidatePath } from 'next/cache'
import { createAuthedServerClient } from '@/lib/supabase/server'
import { londonInputToDate, formatLondon } from '@/lib/shop/bookings'
import { sendEmail, NOTIFY_EMAIL } from '@/lib/email/send'

async function client() {
  return createAuthedServerClient()
}

// ---- Products / lessons -------------------------------------------------

// Blank stock = not tracked (null); otherwise a non-negative whole number.
function parseStock(formData: FormData): number | null {
  const raw = String(formData.get('stock') ?? '').trim()
  if (raw === '') return null
  const n = Math.round(Number(raw))
  return Number.isFinite(n) && n >= 0 ? n : null
}

export async function saveProduct(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const pounds = Number(formData.get('price') ?? 0)
  const active = formData.get('active') === 'on'
  const image = String(formData.get('image') ?? '').trim()
  if (!id || !name || !Number.isFinite(pounds) || pounds < 0) return
  try {
    const supabase = await client()
    await supabase
      .from('products')
      .update({
        name,
        description,
        price_pence: Math.round(pounds * 100),
        active,
        stock: parseStock(formData),
        ...(image ? { image } : {}),
      })
      .eq('id', id)
  } catch (e) {
    console.error('saveProduct failed', e)
  }
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  revalidatePath('/shop/[slug]', 'page')
  revalidatePath('/')
}

export async function createProduct(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase()
  const type = formData.get('type') === 'lesson' ? 'lesson' : 'physical'
  const pounds = Number(formData.get('price') ?? 0)
  const description = String(formData.get('description') ?? '').trim()
  if (!name || !slug || !Number.isFinite(pounds) || pounds <= 0) return
  try {
    const supabase = await client()
    await supabase.from('products').insert({
      name,
      slug,
      type,
      description,
      price_pence: Math.round(pounds * 100),
      image: String(formData.get('image') ?? '/aml/tiles-2.png').trim() || '/aml/tiles-2.png',
      active: true,
      stock: parseStock(formData),
    })
  } catch (e) {
    console.error('createProduct failed', e)
  }
  revalidatePath('/admin/products')
  revalidatePath('/shop')
}

// ---- Bookings / orders ---------------------------------------------------

export async function setOrderStatus(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['new', 'scheduled', 'fulfilled'].includes(status)) return
  try {
    const supabase = await client()
    await supabase.from('orders').update({ status }).eq('id', id)
  } catch (e) {
    console.error('setOrderStatus failed', e)
  }
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  revalidatePath('/admin/overview')
}

// Set (or move) a lesson's date, mark it scheduled, and email the customer
// the confirmed time. The date is typed as London wall-clock time.
export async function scheduleBooking(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const when = londonInputToDate(String(formData.get('scheduled_at') ?? ''))
  const note = String(formData.get('note') ?? '').trim()
  if (!id || !when) return
  try {
    const supabase = await client()
    const { data, error } = await supabase
      .from('orders')
      .update({ scheduled_at: when.toISOString(), admin_note: note || null, status: 'scheduled' })
      .eq('id', id)
      .select('customer_email, customer_name')
      .single()
    if (error || !data) {
      console.error('scheduleBooking update failed', error)
      return
    }
    try {
      await sendEmail({
        to: data.customer_email,
        subject: `Your mahjong lesson is booked - ${formatLondon(when.toISOString())}`,
        text:
          `Dear ${data.customer_name ?? 'mahjong friend'},\n\n` +
          `Your American Mahjong lesson is confirmed for:\n\n${formatLondon(when.toISOString())}\n\n` +
          (note ? `${note}\n\n` : '') +
          `Need to change the time? Just reply to this email.\n\nSee you at the table!\nAndrew\nAmerican Mahjong | London`,
        replyTo: NOTIFY_EMAIL,
      })
    } catch (e) {
      // The booking is saved; a failed email just means Andrew follows up by hand.
      console.error('scheduleBooking email failed', e)
    }
  } catch (e) {
    console.error('scheduleBooking failed', e)
  }
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  revalidatePath('/admin/overview')
  revalidatePath('/my-lessons')
}

// ---- Contact inbox --------------------------------------------------------

export async function setMessageStatus(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['new', 'read', 'replied'].includes(status)) return
  try {
    const supabase = await client()
    await supabase.from('contact_messages').update({ status }).eq('id', id)
  } catch (e) {
    console.error('setMessageStatus failed', e)
  }
  revalidatePath('/admin/messages')
}

// ---- Blog posts ------------------------------------------------------------

export async function createPost(formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim()
  const excerpt = String(formData.get('excerpt') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  if (!title || !body) return
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
  try {
    const supabase = await client()
    await supabase.from('posts').insert({ title, slug, excerpt, body })
  } catch (e) {
    console.error('createPost failed', e)
  }
  revalidatePath('/admin/posts')
}

export async function setPostPublished(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const publish = formData.get('publish') === 'true'
  if (!id) return
  try {
    const supabase = await client()
    await supabase
      .from('posts')
      .update({ published: publish, published_at: publish ? new Date().toISOString() : null })
      .eq('id', id)
  } catch (e) {
    console.error('setPostPublished failed', e)
  }
  revalidatePath('/admin/posts')
  revalidatePath('/blog')
}

export async function deletePost(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  try {
    const supabase = await client()
    await supabase.from('posts').delete().eq('id', id)
  } catch (e) {
    console.error('deletePost failed', e)
  }
  revalidatePath('/admin/posts')
  revalidatePath('/blog')
}
