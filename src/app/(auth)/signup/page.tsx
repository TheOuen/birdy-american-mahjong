'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/browser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AmlMark } from '@/components/layout/AmlMark'

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const supabase = createBrowserClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccess(true)
  }

  async function handleGoogleSignUp() {
    setError(null)
    const supabase = createBrowserClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/lobby',
      },
    })

    if (oauthError) {
      setError(oauthError.message)
    }
  }

  return (
    <>
      <Header />
      <main id="main" className="flex-1 flex items-center justify-center bg-[var(--accent-blush)] px-6 py-12 sm:py-16">
        <div className="tile-frame tile-edge-jade w-full max-w-md">
          <div className="tile-face bg-[var(--bg-elevated)] px-7 py-10 sm:px-9">
            <div className="flex justify-center mb-6">
              <AmlMark className="h-14 w-auto" />
            </div>

            <h1 className="display-lg text-center text-[var(--text-primary)] mb-2">
              Create your account
            </h1>
            <p className="text-center text-[var(--text-secondary)] mb-8 text-lg">
              Join the table and start playing Birdy
            </p>

            {success && (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--success)] bg-[var(--success-light)] px-4 py-3 mb-6"
                role="status"
              >
                <p className="text-[var(--success)] font-medium text-base">
                  Check your email to confirm your account
                </p>
                <p className="text-[var(--success)] mt-1 text-base">
                  We sent a confirmation link to <strong>{email}</strong>. Once confirmed, you can{' '}
                  <Link href="/login" className="underline underline-offset-2 font-medium">
                    sign in
                  </Link>
                  .
                </p>
              </div>
            )}

            {error && (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--error)] bg-[var(--error-light)] px-4 py-3 mb-6"
                role="alert"
              >
                <p className="text-[var(--error)] text-base">{error}</p>
              </div>
            )}

            {!success && (
              <>
                <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                  <label className="flex flex-col gap-2 text-base font-medium text-[var(--text-primary)]" htmlFor="displayName">
                    Display name
                    <input
                      id="displayName"
                      type="text"
                      required
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How others will see you"
                      className="input-elegant"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-base font-medium text-[var(--text-primary)]" htmlFor="email">
                    Email
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-elegant"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-base font-medium text-[var(--text-primary)]" htmlFor="password">
                    Password
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="input-elegant"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-base font-medium text-[var(--text-primary)]" htmlFor="confirmPassword">
                    Confirm password
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="input-elegant"
                    />
                  </label>

                  <button type="submit" disabled={loading} className="btn-primary text-lg h-14">
                    {loading ? 'Creating account…' : 'Create account'}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-[var(--text-muted)] text-sm whitespace-nowrap">or continue with</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="w-full btn-secondary text-base gap-3"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
              </>
            )}

            <p className="text-center mt-8 text-[var(--text-muted)] text-base">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[var(--accent-gold)] font-medium hover:text-[var(--accent-gold-dark)] underline underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
