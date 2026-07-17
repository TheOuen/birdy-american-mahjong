import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

// Cookie-based client so the session set by client-side sign-in (password,
// OTP code, magic link) is visible to Server Components and Route Handlers
// that gate routes via createAuthedServerClient.
export function createBrowserClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
