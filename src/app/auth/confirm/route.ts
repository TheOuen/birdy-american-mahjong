import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createAuthedServerClient } from '@/lib/supabase/server'

// Landing point for the links in Supabase auth emails (magic link, signup
// confirmation). The email templates link here with a token_hash, which we
// exchange for a session cookie server-side, then send the user to the
// right place for their role.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
    const supabase = await createAuthedServerClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const role = (user?.app_metadata as { role?: string } | undefined)?.role
      const destination = role === 'admin' ? '/admin' : '/lobby'
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?message=link-expired', request.url))
}
