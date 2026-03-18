'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/browser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/lobby')
  }

  async function handleGoogleLogin() {
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
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-md rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-8 py-10"
          style={{ boxShadow: '0 1px 3px rgba(45, 42, 38, 0.06)' }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="Birdy American Mahjong"
              width={160}
              height={40}
              priority
            />
          </div>

          {/* Heading */}
          <h1
            className="text-center text-[var(--text-primary)] mb-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'var(--text-3xl)',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Welcome Back
          </h1>
          <p className="text-center text-[var(--text-muted)] mb-8" style={{ fontSize: 'var(--text-base)' }}>
            Sign in to rejoin the table
          </p>

          {/* Error */}
          {error && (
            <div
              className="rounded-sm border border-[var(--error)] bg-[var(--error-light)] px-4 py-3 mb-6"
              role="alert"
            >
              <p className="text-[var(--error)]" style={{ fontSize: 'var(--text-base)' }}>
                {error}
              </p>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-[var(--text-primary)] font-medium"
                style={{ fontSize: 'var(--text-base)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
                style={{
                  fontSize: 'var(--text-base)',
                  minHeight: 'var(--touch-min)',
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-[var(--text-primary)] font-medium"
                style={{ fontSize: 'var(--text-base)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
                style={{
                  fontSize: 'var(--text-base)',
                  minHeight: 'var(--touch-min)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[var(--brand)] text-[var(--text-inverse)] font-semibold hover:bg-[var(--brand-light)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{
                fontSize: 'var(--text-lg)',
                minHeight: 'var(--touch-min)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--text-muted)] text-sm whitespace-nowrap">
              or continue with
            </span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 transition-colors flex items-center justify-center gap-3 cursor-pointer"
            style={{
              fontSize: 'var(--text-base)',
              minHeight: 'var(--touch-min)',
            }}
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

          {/* Sign up link */}
          <p className="text-center mt-8 text-[var(--text-muted)]" style={{ fontSize: 'var(--text-base)' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[var(--brand)] font-medium hover:text-[var(--brand-light)] underline underline-offset-2 transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
