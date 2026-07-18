'use server'

// Admin-role management. Roles live in auth app_metadata (server-set only),
// so these actions use the service client - but only after re-verifying that
// the caller is themselves an admin. The layout gate is UX; this check is the
// guarantee.

import { revalidatePath } from 'next/cache'
import { createAuthedServerClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin(): Promise<{ id: string; email: string } | null> {
  const supabase = await createAuthedServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = (user?.app_metadata as { role?: string } | undefined)?.role
  if (!user || role !== 'admin') return null
  return { id: user.id, email: user.email ?? '' }
}

async function findUserByEmail(email: string) {
  const service = createServiceClient()
  // Small site: page through the user list (a few pages at most) to find a match.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find((u) => u.email?.toLowerCase() === email)
    if (match) return match
    if (data.users.length < 200) return null
  }
  return null
}

/** Give an email address admin access. If no account exists yet, one is
 * created - the person signs in with the usual email-code flow. */
export async function grantAdmin(formData: FormData): Promise<void> {
  const caller = await requireAdmin()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!caller || !email || !email.includes('@')) return

  try {
    const service = createServiceClient()
    const existing = await findUserByEmail(email)
    if (existing) {
      // Merge - updateUserById replaces app_metadata wholesale, and the
      // provider keys Supabase keeps in there must survive.
      await service.auth.admin.updateUserById(existing.id, {
        app_metadata: { ...existing.app_metadata, role: 'admin' },
      })
    } else {
      await service.auth.admin.createUser({
        email,
        email_confirm: true,
        app_metadata: { role: 'admin' },
      })
    }
  } catch (e) {
    console.error('grantAdmin failed', e)
  }
  revalidatePath('/admin/team')
}

/** Take admin access away. Refuses to demote the caller so the last person
 * in the room cannot lock themselves out. */
export async function revokeAdmin(formData: FormData): Promise<void> {
  const caller = await requireAdmin()
  const userId = String(formData.get('user_id') ?? '')
  if (!caller || !userId || userId === caller.id) return

  try {
    const service = createServiceClient()
    const { data, error } = await service.auth.admin.getUserById(userId)
    if (error || !data.user) {
      console.error('revokeAdmin lookup failed', error)
      return
    }
    await service.auth.admin.updateUserById(userId, {
      app_metadata: { ...data.user.app_metadata, role: 'player' },
    })
  } catch (e) {
    console.error('revokeAdmin failed', e)
  }
  revalidatePath('/admin/team')
}
