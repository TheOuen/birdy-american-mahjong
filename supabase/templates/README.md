# Supabase email templates

Branded (AML navy / berry / cream) email templates for Supabase Auth. Each
email contains a **sign-in button** (magic link) and, for the magic-link
email, a **6-digit code** the user can type instead — both are the same
one-time credential, so whichever they use first wins.

## How to install

In the Supabase Dashboard for this project:

1. Go to **Authentication → Emails → Templates**.
2. **Magic Link** tab → replace the body with `magic-link.html`, set the
   subject to `Your sign-in code for American Mahjong | London`.
3. **Confirm signup** tab → replace the body with `confirm-signup.html`, set
   the subject to `Welcome! Please confirm your email`.

## Required auth settings

These templates link to the app's `/auth/confirm` route, so the URL settings
must be right:

1. **Authentication → URL Configuration**
   - **Site URL**: the deployed app URL (e.g. `https://americanmahjonglondon.com`).
     For local testing use `http://localhost:3000`. The `{{ .SiteURL }}` in the
     templates resolves to this value.
   - **Redirect URLs**: add the production URL and `http://localhost:3000/**`.
2. **Authentication → Sign In / Providers → Email**
   - Email provider **enabled**.
   - **Email OTP length**: 6 (the login page expects 6 digits).
   - **Email OTP expiry**: 3600 seconds (the emails say "one hour" — keep in sync).

Note: Supabase's built-in email sender is fine for testing but is
rate-limited (a few emails per hour). Before launch, configure custom SMTP
(**Project Settings → Auth → SMTP**) — e.g. via Resend, which this project
already uses for contact emails.

## How the flow works in the app

- The login page (`src/app/(auth)/login/page.tsx`) calls
  `signInWithOtp({ email })`, which sends the Magic Link email. The user
  either types the 6-digit `{{ .Token }}` code (verified client-side with
  `verifyOtp`) or clicks the button.
- The button links to `/auth/confirm?token_hash={{ .TokenHash }}&type=...`,
  handled by `src/app/auth/confirm/route.ts`, which verifies the token
  server-side and sets the session cookie.
- After sign-in, admins (`app_metadata.role = 'admin'`) land on `/admin`;
  everyone else lands on `/lobby`.

## Making someone an admin

Set the role in **server-side** app metadata (never user-editable
`user_metadata`). In the Dashboard SQL editor:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = 'hello@americanmahjonglondon.com';
```

The user then signs in via the normal login page — no password needed with
the code/magic-link flow.
