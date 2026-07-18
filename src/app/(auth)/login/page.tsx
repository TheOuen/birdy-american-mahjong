'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase/browser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AmlMark } from '@/components/layout/AmlMark'

type LoginMethod = 'code' | 'password'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [method, setMethod] = useState<LoginMethod>('code')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(() =>
    searchParams.get('message') === 'link-expired'
      ? 'That sign-in link has expired. Please enter your email below and we will send you a fresh one.'
      : null
  )
  const [loading, setLoading] = useState(false)

  function goWhereTheyBelong(user: User | null) {
    const role = (user?.app_metadata as { role?: string } | undefined)?.role
    router.push(role === 'admin' ? '/admin' : '/lobby')
  }

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    const supabase = createBrowserClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    setLoading(false)
    if (otpError) {
      setError(otpError.message)
      return
    }

    setCodeSent(true)
    setCode('')
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createBrowserClient()
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })

    if (verifyError) {
      setError('That code was not right. Please check the email and try again, or send a new code.')
      setLoading(false)
      return
    }

    goWhereTheyBelong(data.user)
  }

  async function handleResendCode() {
    setError(null)
    setNotice(null)
    setLoading(true)

    const supabase = createBrowserClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    setLoading(false)
    if (otpError) {
      setError(otpError.message)
      return
    }
    setCode('')
    setNotice('A new code is on its way to ' + email + '.')
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createBrowserClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    goWhereTheyBelong(data.user)
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

  function switchMethod(next: LoginMethod) {
    setMethod(next)
    setCodeSent(false)
    setCode('')
    setError(null)
    setNotice(null)
  }

  return (
    <>
      <Header />
      <main id="main" className="flex-1 flex items-center justify-center bg-[var(--accent-blush)] px-6 py-12 sm:py-16">
        <div className="tile-frame tile-edge-berry w-full max-w-md">
          <div className="tile-face bg-[var(--bg-elevated)] px-7 py-10 sm:px-9">
            <div className="flex justify-center mb-6">
              <AmlMark className="h-14 w-auto" />
            </div>

            <h1 className="display-lg text-center text-[var(--text-primary)] mb-2">
              Welcome back
            </h1>
            <p className="text-center text-[var(--text-secondary)] mb-8 text-lg">
              Sign in to play Birdy online
            </p>

            {/* Method toggle */}
            <div className="grid grid-cols-2 gap-2 mb-8" role="tablist" aria-label="How would you like to sign in?">
              <button
                type="button"
                role="tab"
                aria-selected={method === 'code'}
                onClick={() => switchMethod('code')}
                className={`h-14 rounded-[var(--radius-md)] text-base font-medium border transition-colors ${
                  method === 'code'
                    ? 'bg-[var(--brand)] text-[var(--text-inverse)] border-[var(--brand)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-strong)]'
                }`}
              >
                Email me a code
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === 'password'}
                onClick={() => switchMethod('password')}
                className={`h-14 rounded-[var(--radius-md)] text-base font-medium border transition-colors ${
                  method === 'password'
                    ? 'bg-[var(--brand)] text-[var(--text-inverse)] border-[var(--brand)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-strong)]'
                }`}
              >
                Use my password
              </button>
            </div>

            {error && (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--error)] bg-[var(--error-light)] px-4 py-3 mb-6"
                role="alert"
              >
                <p className="text-[var(--error)] text-base">{error}</p>
              </div>
            )}

            {notice && (
              <div
                className="rounded-[var(--radius-md)] border border-[var(--success)] bg-[var(--success-light)] px-4 py-3 mb-6"
                role="status"
              >
                <p className="text-[var(--success)] text-base">{notice}</p>
              </div>
            )}

            {method === 'code' && !codeSent && (
              <form onSubmit={handleSendCode} className="flex flex-col gap-5">
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

                <p className="text-[var(--text-secondary)] text-base">
                  No password needed — we&apos;ll email you a sign-in link and a one-time code.
                </p>

                <button type="submit" disabled={loading} className="btn-primary text-lg h-14">
                  {loading ? 'Sending…' : 'Email me a code'}
                </button>
              </form>
            )}

            {method === 'code' && codeSent && (
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
                <p className="text-[var(--text-secondary)] text-base">
                  We&apos;ve emailed <strong className="text-[var(--text-primary)]">{email}</strong>.
                  Click the link in that email, or type the code from the email here:
                </p>

                <label className="flex flex-col gap-2 text-base font-medium text-[var(--text-primary)]" htmlFor="code">
                  Your code
                  <input
                    id="code"
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6,8}"
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678"
                    className="input-elegant text-center text-2xl tracking-[0.35em]"
                  />
                </label>

                <button type="submit" disabled={loading || code.length < 6} className="btn-primary text-lg h-14">
                  {loading ? 'Checking…' : 'Sign in'}
                </button>

                <div className="flex flex-col gap-1 text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-[var(--accent-gold)] font-medium underline underline-offset-2 py-2 min-h-[var(--touch-min)]"
                  >
                    Send a new code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false)
                      setCode('')
                      setNotice(null)
                    }}
                    className="text-[var(--text-muted)] underline underline-offset-2 py-2 min-h-[var(--touch-min)]"
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            )}

            {method === 'password' && (
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="input-elegant"
                  />
                </label>

                <button type="submit" disabled={loading} className="btn-primary text-lg h-14">
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            )}

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[var(--text-muted)] text-sm whitespace-nowrap">or continue with</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
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

            <p className="text-center mt-8 text-[var(--text-muted)] text-base">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-[var(--accent-gold)] font-medium hover:text-[var(--accent-gold-dark)] underline underline-offset-2 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
