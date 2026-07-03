# Birdy American Mahjong — Claude Build Rules

This file governs how Claude (AI assistant) builds and maintains this codebase.
Read `docs/plans/2026-03-18-american-mahjong-design.md`, `docs/RULES.md`, and `docs/NMJL_2025_CARD.md` before making changes.

---

## Project Overview

**Product:** American Mahjong | London — the online home of AML: lessons, shop, and free online play
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth, DB, Realtime, Edge Functions) · Stripe (hosted Checkout) · Resend (email)
**Target audience:** Primarily elderly women — design must be accessible, warm, and simple
**Brand:** American Mahjong | London (site brand); the online game is "Birdy" (peacock logo appears only in game surfaces)
**Visual style:** AML palette — navy, berry, blush pink, cream (sampled from americanmahjonglondon.com); Poppins typography

---

## Stack & Conventions

### Framework
- **Next.js 16 App Router** — all routes in `src/app/`
- Use `server components` by default; add `'use client'` only when needed
- Use `loading.tsx` and `error.tsx` per route segment

### Language
- **TypeScript everywhere** — no `any`, no untyped function params
- Use `type` (not `interface`) for object shapes

### Styling
- **Tailwind CSS v4** — utility classes only, no custom CSS files except globals
- Design tokens in `src/styles/tokens.css` (imported in globals)
- Never hardcode hex values — use token class names

### Database
- **Supabase** — all data access via `src/lib/supabase/` helpers
- Use `createServerClient` for server components, `createBrowserClient` for client
- Never expose service role key client-side
- Every table must have RLS policies

### Auth
- Supabase Auth (email + Google OAuth)
- Game routes `(game)/*` require auth
- Admin routes `(admin)/*` require `role = 'admin'` in user metadata

### Game Engine
- Core logic in `src/lib/game-engine/` — pure TypeScript, no framework deps
- Same engine runs client-side (optimistic UI) and in Edge Functions (authoritative)
- Game state synced via Supabase Realtime broadcast channels
- All game mutations go through Edge Functions (never direct DB writes from client)

---

## File Structure

```
src/
  app/
    (public)/              # Home, private-lessons, about, discover, london-local, get-in-touch, how-to-play
    (auth)/                # Login, signup
    (game)/                # Lobby, play, stats (requires auth)
    (shop)/                # Shop grid, product detail, cart, checkout/success
    (admin)/admin/         # Admin panel (requires admin role) — includes orders
    api/game/              # Game action endpoints
    api/matchmaking/       # Queue + bot backfill
    api/checkout/          # Create Stripe hosted Checkout session
    api/stripe/webhook/    # Stripe webhook — only writer of orders
    api/contact/           # Contact form → Resend email
    api/newsletter/        # Newsletter signup → newsletter_subscribers
  components/
    ui/                    # Button, Input, Modal, ContactForm, NewsletterForm
    layout/                # Header, Footer, AmlLogo
    game/                  # Board, Hand, DiscardPile, Wall, Charleston
    shop/                  # CartProvider, ProductCard, AddToCartButton, CartContents
    tiles/                 # SVG tile components (152 tiles)
  lib/
    supabase/              # Server + browser client helpers
    game-engine/           # State machine, validation, scoring
    shop/                  # cart, products, checkout, orders, types
    email/                 # Resend send helper + contact validation
    tiles/                 # Tile definitions, constants
    matchmaking/           # Queue logic, bot backfill
  styles/
    globals.css
    tokens.css
  supabase/
    migrations/            # SQL schema files (001 core, 002 shop; not run until Supabase connected)
public/
  aml/                     # AML site assets (images, downloadable scorecard PDFs)
```

---

## Design Rules

### Do
- Use warm earth tones from tokens (terracotta, ochre, deep green, sandy neutrals)
- Minimum 18px base font size — elderly audience
- Minimum 48px touch targets (WCAG AAA)
- High contrast: 4.5:1 minimum ratio
- Generous whitespace and padding
- Sharp corners (`rounded-sm` or `rounded-md`) — editorial feel
- Show Birdy brand throughout (logo in header, branded tiles)
- Big, clear buttons with descriptive labels
- Confirmation before irreversible game actions

### Don't
- No gradients on buttons or cards
- No heavy shadows
- No hover-only interactions — everything must be tappable
- No small or fiddly UI elements
- No tech-looking design — warm and welcoming, not slick
- No lorem ipsum — use real content or `[TODO: content]`

---

## Component Rules

- One component per file, named exports only
- Props typed with `type ComponentNameProps = {...}`
- Keep components small — extract when >100 lines
- No business logic in UI components

---

## Game Rules Reference

- 152 tiles: 108 suit (Bam/Crak/Dot 1-9 x4), 16 winds, 12 dragons, 8 flowers, 8 jokers
- Jokers: only in groups of 3+, never pairs or singles
- Turn order: counter-clockwise
- Charleston: Right → Across → Left (mandatory), optional second + courtesy pass
- Winning: match hand to NMJL card pattern exactly
- Scoring: self-draw = all pay, discard win = discarder pays double

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | PascalCase for components | `TileRenderer.tsx` |
| Files | camelCase for libs | `gameEngine.ts` |
| Route folders | lowercase-kebab | `how-to-play/` |
| Components | PascalCase | `GameBoard` |
| Props types | ComponentName + Props | `GameBoardProps` |
| DB tables | plural snake_case | `game_players` |
| DB columns | snake_case | `is_dead` |

---

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=              # server-only
STRIPE_WEBHOOK_SECRET=          # server-only
RESEND_API_KEY=                 # server-only
ORDER_NOTIFY_EMAIL=hello@americanmahjonglondon.com
```

---

## What Not To Do

- **No ads in V1** — out of scope
- **Playing is free** — the game has no paywall. The shop (lessons + equipment) uses Stripe hosted Checkout; prices are always looked up server-side from the products table.
- **Stripe webhook is the only writer of orders** — via service client.
- **No client-side game state mutations** — all through Edge Functions
- **No exposing wall tiles to client** — server-authoritative only
- **No unprotected admin routes**
