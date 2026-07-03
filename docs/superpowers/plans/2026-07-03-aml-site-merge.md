# American Mahjong | London Site Merge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand this platform as American Mahjong | London (AML), add their content pages and a full cart + Stripe shop, keeping the Birdy game engine untouched as the "Play Online" feature.

**Architecture:** Reskin + extend in place. Retheme `src/styles/tokens.css` (keeping token *names* so game components are untouched), rebuild Header/Footer with AML branding and nav, add content routes to `(public)`, add a `(shop)` route group with a client-side cart and Stripe hosted Checkout, record orders via webhook into Supabase, email notifications via Resend.

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase · Stripe (hosted Checkout + webhooks) · Resend · Vitest (new)

**Spec:** `docs/superpowers/specs/2026-07-02-aml-site-merge-design.md`

## Global Constraints

- TypeScript everywhere; no `any`; use `type` not `interface`; named exports; one component per file; props typed `ComponentNameProps`.
- Tailwind v4 utilities + `var(--token)` arbitrary values only. **No hardcoded hex outside `src/styles/tokens.css`.**
- Accessibility: 18px minimum base font, 48px touch targets (`--touch-min`), 4.5:1 contrast, no gradients on buttons/cards, no heavy shadows, no hover-only interactions.
- Site brand everywhere: **American Mahjong | London**. The game is called **Birdy** ("Play Birdy Online"). Tagline: "Learn it once, love it forever!"
- Contact details: `hello@americanmahjonglondon.com` · `+44 738 639 8249`.
- All prices are **integer pence**. Checkout prices are looked up server-side from the `products` table — never trust client prices.
- Every new table gets RLS enabled in the same migration that creates it.
- Game engine (`src/lib/game-engine/`, `src/lib/nmjl/`, `(game)` routes) must not change. `npm test` must keep the existing engine test green.
- Exact product catalog (verbatim from the live Squarespace store):
  | slug | name | price | type |
  |------|------|-------|------|
  | `beginner-individual-session` | Beginner Individual Session (2.5 Hours) | £250.00 | lesson |
  | `beginner-group-session` | Beginner Group Session (2.5 Hours, per person) | £150.00 | lesson |
  | `private-session-1-hour` | Private Session (1 Hour) | £125.00 | lesson |
  | `nmjl-card-2026` | 2026 Official NMJL Card (Large Print) | £15.00 | physical |
  | `scorecard-notepad` | American Mahjong Scorecard Notepad (A5, 50 pages) | £10.00 | physical |
- AML palette (sampled from their live `site.css` — Squarespace theme HSL variables converted to hex): navy `#171D3A` (their "black"), indigo `#354D9C`, berry `#9E2057`, blush `#FCE8F0`, cream `#F5F0E8`, pale lavender `#E5E9FD`, periwinkle `#94ABF9`, orchid `#F598FF` (decorative only — fails text contrast). White backgrounds.
- Fonts: body/nav = **Poppins**; headings = Poppins 700 for now (their heading font "Synthemesc" is an Adobe-licensed face; swap in later only if the client supplies a license — the CSS variable `--font-display` is the single swap point).
- New env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ORDER_NOTIFY_EMAIL` (defaults in code to hello@americanmahjonglondon.com). No Stripe publishable key is needed — hosted Checkout is a server-side redirect, no Stripe.js.

---

### Task 1: Vitest test infrastructure

**Files:**
- Modify: `package.json` (add script + devDeps)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm test` runs Vitest against `src/**/*.test.ts`. All later tasks rely on this command.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Add test script to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run"
```

- [ ] **Step 4: Run the existing engine tests**

Run: `npm test`
Expected: PASS — the existing `src/lib/game-engine/__tests__/scoring.test.ts` suite runs green. If it fails, STOP and report; do not modify engine code.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

### Task 2: Scrape AML assets into `/public/aml/`

**Files:**
- Create: `public/aml/*.{jpeg,png}` (downloaded), `public/aml/downloads/*.pdf`

**Interfaces:**
- Produces: local image paths used by all page tasks:
  `/aml/hero.jpeg`, `/aml/andrew.jpeg`, `/aml/nmjl-card-2026.png`, `/aml/scorecard-notepad.png`, `/aml/lesson-individual.png`, `/aml/lesson-1-hour.png`, `/aml/tiles-1.png`, `/aml/tiles-2.png`, `/aml/tiles-3.png`, `/aml/tiles-4.png`, `/aml/tiles-5.png`, `/aml/how-it-works.png`, `/aml/downloads/scorecard-landscape.pdf`, `/aml/downloads/scorecard-portrait.pdf`

- [ ] **Step 1: Download images from the Squarespace CDN**

```bash
mkdir -p public/aml/downloads
BASE="https://images.squarespace-cdn.com/content/v1/69ad3ccd583cef279e993f62"
curl -fsSL "$BASE/31fd26ed-1286-4c49-b3e9-4f8f18475118/IMG_5635.jpeg" -o public/aml/hero.jpeg
curl -fsSL "$BASE/3348c761-8260-4794-96ce-fac9129dae7c/IMG_5448.jpeg" -o public/aml/andrew.jpeg
curl -fsSL "$BASE/30483bf0-0d5e-4922-a99d-d65484f1ad7f/NMJL+Card+2026.png" -o public/aml/nmjl-card-2026.png
curl -fsSL "$BASE/ddca0921-f998-4a49-964b-11c1dc5dbdec/Square+Space+Canva.png" -o public/aml/scorecard-notepad.png
curl -fsSL "$BASE/5a4d0ab4-86b0-47e7-996e-bbba069e5695/Private+1hr+.png" -o public/aml/lesson-individual.png
curl -fsSL "$BASE/a2eea971-1a23-470a-8699-19f5b6ca8dd6/Private+1+Hour+Session+.png" -o public/aml/lesson-1-hour.png
curl -fsSL "$BASE/d33dd92c-6f6c-46ee-aad3-eed3a1755bfa/4abbe98b-1f25-43b1-b012-8e9f5db945a2.png" -o public/aml/tiles-1.png
curl -fsSL "$BASE/4f6ec7c7-3dfe-4ff7-ab4f-8a8aca5204aa/f03b8f0e-216a-43c6-baa0-ea4805af6df7.png" -o public/aml/tiles-2.png
curl -fsSL "$BASE/b3de47e0-1171-4d65-af3e-f7dc48f9412a/33f66992-d604-4cf9-9b6c-3cc90ae12997.png" -o public/aml/tiles-3.png
curl -fsSL "$BASE/abb7ba25-030c-4e86-a3bb-7f2fa1def544/5392356e-4e5b-4737-b250-c24a90a07729.png" -o public/aml/tiles-4.png
curl -fsSL "$BASE/dfc1139d-bae3-4ef8-a811-97540c086782/1f68ecd0-49a6-401f-a5db-8b8592322687.png" -o public/aml/tiles-5.png
curl -fsSL "$BASE/e38e2e92-cce1-4e16-9928-76b351500ab1/c70f1b34-6de7-42bc-b2ce-09a6582d30c5.png" -o public/aml/how-it-works.png
```

- [ ] **Step 2: Download the free scorecard PDFs (Google Drive)**

```bash
curl -fsSL "https://drive.google.com/uc?export=download&id=1GLdT5yH_8eE15dkoMSzi3ueDM7hT79ru" -o public/aml/downloads/scorecard-landscape.pdf
curl -fsSL "https://drive.google.com/uc?export=download&id=1TfvXuILKJ4JCKYfw9ymT57G4DRZ9vach" -o public/aml/downloads/scorecard-portrait.pdf
```

- [ ] **Step 3: Verify every file is a real asset (fail loudly)**

```bash
for f in public/aml/*.jpeg public/aml/*.png public/aml/downloads/*.pdf; do
  size=$(wc -c < "$f"); kind=$(file -b "$f")
  echo "$f  $size  $kind"
  [ "$size" -gt 5000 ] || { echo "FAIL: $f too small — bad download"; exit 1; }
done
```

Expected: every file > 5 KB; images report as JPEG/PNG data, PDFs as `PDF document`. Google Drive sometimes returns an HTML interstitial instead of the file — if a "PDF" reports as HTML, re-download with `curl -fsSL "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`. Open both PDFs and check which is landscape vs portrait; swap filenames if reversed.

- [ ] **Step 4: Commit**

```bash
git add public/aml
git commit -m "feat: import AML site assets (images, free scorecard PDFs)"
```

---

### Task 3: AML theme — tokens, fonts, site metadata

**Files:**
- Modify: `src/styles/tokens.css` (palette + font values only — keep every token NAME)
- Modify: `src/app/layout.tsx` (fonts, metadata)

**Interfaces:**
- Produces: same CSS custom-property names as today (`--brand`, `--accent-warm`, `--accent-gold`, `--bg`, etc.) with AML values, plus new tokens `--accent-blush: #FCE8F0`, `--accent-lavender: #E5E9FD`, `--accent-periwinkle: #94ABF9`, `--accent-cream: #F5F0E8`. All page tasks style exclusively with these.

- [ ] **Step 1: Remap token values in `src/styles/tokens.css`**

Replace the values of the existing tokens (names unchanged). Keep ALL tile tokens (`--tile-*`), `--bg-table`, feedback tokens, spacing, and `--touch-min` exactly as they are. New values:

```css
/* American Mahjong | London — Design Tokens */
/* Playful modern: navy, berry, blush pink, cream — sampled from americanmahjonglondon.com */

  /* Typography */
  --font-display: 'Poppins', 'Segoe UI', system-ui, sans-serif; /* swap point for licensed Synthemesc */
  --font-body: 'Poppins', 'Segoe UI', system-ui, sans-serif;

  /* Background */
  --bg: #FFFFFF;
  --bg-card: #F5F0E8;
  --bg-elevated: #FFFFFF;
  --bg-deep: #171D3A;
  /* --bg-table unchanged */

  /* Text */
  --text-primary: #171D3A;
  --text-secondary: #3E4460;
  --text-muted: #62677F;
  --text-inverse: #FFFFFF;
  --text-gold: #354D9C;

  /* Brand — AML Navy */
  --brand: #171D3A;
  --brand-light: #2A3462;
  --brand-dark: #0F1428;
  --brand-subtle: rgba(23, 29, 58, 0.06);

  /* Accent — Berry (was terracotta) */
  --accent-warm: #9E2057;
  --accent-warm-light: #B94577;
  --accent-warm-dark: #7C1843;
  --accent-warm-subtle: rgba(158, 32, 87, 0.08);

  /* Accent — Indigo (was ochre gold) */
  --accent-gold: #354D9C;
  --accent-gold-light: #94ABF9;
  --accent-gold-dark: #27397A;
  --accent-gold-subtle: rgba(53, 77, 156, 0.08);

  /* New AML accents */
  --accent-blush: #FCE8F0;
  --accent-lavender: #E5E9FD;
  --accent-periwinkle: #94ABF9;
  --accent-cream: #F5F0E8;

  /* Borders */
  --border: #E5E9FD;
  --border-strong: #C6CEF2;
  --border-gold: rgba(53, 77, 156, 0.3);
```

Leave every other block in the file untouched.

- [ ] **Step 2: Swap fonts and metadata in `src/app/layout.tsx`**

Replace the Google Fonts `<link>` href with:

```
https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap
```

Replace the metadata export:

```ts
export const metadata: Metadata = {
  title: "American Mahjong | London",
  description:
    "Learn American Mahjong in London with Andrew — private lessons, official NMJL cards, and free online play. Learn it once, love it forever!",
};
```

- [ ] **Step 3: Visual sanity check**

Run: `npm run dev` and open `http://localhost:3000`.
Expected: site renders with white background, navy text, Poppins everywhere. Game pages still render (tile colors unchanged). Also run `npm test` — engine tests still PASS.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/app/layout.tsx
git commit -m "feat: retheme to American Mahjong London palette and Poppins"
```

---

### Task 4: Database migration — products, orders, newsletter

**Files:**
- Create: `supabase/migrations/002_shop.sql`

**Interfaces:**
- Produces: tables `products`, `orders`, `newsletter_subscribers` with the columns below. Later tasks read `products` with the anon client and write `orders`/`newsletter_subscribers` with the service client (`createServiceClient()` from `src/lib/supabase/server.ts`).

- [ ] **Step 1: Write the migration**

```sql
-- 002_shop.sql — AML shop: products, orders, newsletter
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  price_pence integer not null check (price_pence > 0),
  type text not null check (type in ('physical', 'lesson')),
  image text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table products enable row level security;
create policy "products are publicly readable"
  on products for select using (true);

create table orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  customer_email text not null,
  customer_name text,
  shipping_address jsonb,
  items jsonb not null,
  total_pence integer not null,
  status text not null default 'new' check (status in ('new', 'fulfilled')),
  user_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);
alter table orders enable row level security;
create policy "customers read own orders"
  on orders for select using (auth.uid() = user_id);
create policy "admins read all orders"
  on orders for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
create policy "admins update order status"
  on orders for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
-- inserts happen only via service role (webhook), which bypasses RLS

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;
-- no public policies: inserts via service role only

insert into products (slug, name, description, price_pence, type, image) values
  ('beginner-individual-session', 'Beginner Individual Session (2.5 Hours)',
   'New to Mahjong? Our Beginner Session is the perfect place to start. Learn the tiles, the rules, and how to build winning hands — at your own pace. You''ll leave with a complete guide to take home and return to anytime.',
   25000, 'lesson', '/aml/lesson-individual.png'),
  ('beginner-group-session', 'Beginner Group Session (2.5 Hours, per person)',
   'Learn everything you need to know to play American Mahjong from scratch, in a group of 2, 3, or 4. Cover the tiles, the rules, and winning hand construction at your own pace, and leave with a complete guide to take home.',
   15000, 'lesson', '/aml/tiles-4.png'),
  ('private-session-1-hour', 'Private Session (1 Hour)',
   'Already know American Mahjong? This session is designed for you. Refresh your knowledge of the rules and etiquette, keep building on your game, and pick up advanced strategy, gameplay and tips to take your game to the next level.',
   12500, 'lesson', '/aml/lesson-1-hour.png'),
  ('nmjl-card-2026', '2026 Official NMJL Card (Large Print)',
   'The official 2026 National Mah Jongg League card, large print edition, imported from the US. Released every April with the year''s official winning hands — required to play American Mahjong.',
   1500, 'physical', '/aml/nmjl-card-2026.png'),
  ('scorecard-notepad', 'American Mahjong Scorecard Notepad (A5, 50 pages)',
   'Keep scoring simple. A5 notepad with 50 tear-off scorecard pages, designed for American Mahjong.',
   1000, 'physical', '/aml/scorecard-notepad.png');
```

- [ ] **Step 2: Sanity-check the SQL**

Run: `grep -c "enable row level security" supabase/migrations/002_shop.sql`
Expected: `3` (every table has RLS). Migrations are applied when Supabase is connected (same status as `001_initial_schema.sql`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_shop.sql
git commit -m "feat(db): products, orders, newsletter tables with RLS and seed catalog"
```

---

### Task 5: Cart library (pure logic + tests)

**Files:**
- Create: `src/lib/shop/types.ts`
- Create: `src/lib/shop/cart.ts`
- Test: `src/lib/shop/cart.test.ts`

**Interfaces:**
- Produces:
  - `type Product = { id: string; slug: string; name: string; description: string; price_pence: number; type: 'physical' | 'lesson'; image: string; active: boolean }`
  - `type CartItem = { slug: string; name: string; price_pence: number; quantity: number; image: string; type: 'physical' | 'lesson' }`
  - `type CartState = { items: CartItem[] }`
  - `type CartAction = { type: 'add'; item: Omit<CartItem, 'quantity'> } | { type: 'remove'; slug: string } | { type: 'setQuantity'; slug: string; quantity: number } | { type: 'clear' }`
  - `cartReducer(state: CartState, action: CartAction): CartState`
  - `cartCount(state: CartState): number` — total quantity
  - `cartTotalPence(state: CartState): number`
  - `formatGbp(pence: number): string` — `1500` → `"£15.00"`
  - `EMPTY_CART: CartState`

- [ ] **Step 1: Write `src/lib/shop/types.ts`**

```ts
export type Product = {
  id: string
  slug: string
  name: string
  description: string
  price_pence: number
  type: 'physical' | 'lesson'
  image: string
  active: boolean
}

export type CartItem = {
  slug: string
  name: string
  price_pence: number
  quantity: number
  image: string
  type: 'physical' | 'lesson'
}

export type CartState = { items: CartItem[] }

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'quantity'> }
  | { type: 'remove'; slug: string }
  | { type: 'setQuantity'; slug: string; quantity: number }
  | { type: 'clear' }
```

- [ ] **Step 2: Write the failing tests `src/lib/shop/cart.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { cartReducer, cartCount, cartTotalPence, formatGbp, EMPTY_CART } from './cart'
import type { CartItem } from './types'

const card: Omit<CartItem, 'quantity'> = {
  slug: 'nmjl-card-2026', name: '2026 Official NMJL Card (Large Print)',
  price_pence: 1500, image: '/aml/nmjl-card-2026.png', type: 'physical',
}
const lesson: Omit<CartItem, 'quantity'> = {
  slug: 'private-session-1-hour', name: 'Private Session (1 Hour)',
  price_pence: 12500, image: '/aml/lesson-1-hour.png', type: 'lesson',
}

describe('cartReducer', () => {
  it('adds a new item with quantity 1', () => {
    const s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    expect(s.items).toEqual([{ ...card, quantity: 1 }])
  })

  it('adding an existing item increments quantity', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: card })
    expect(s.items).toEqual([{ ...card, quantity: 2 }])
  })

  it('removes an item by slug', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: lesson })
    s = cartReducer(s, { type: 'remove', slug: card.slug })
    expect(s.items.map((i) => i.slug)).toEqual([lesson.slug])
  })

  it('setQuantity updates quantity', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 5 })
    expect(s.items[0].quantity).toBe(5)
  })

  it('setQuantity to 0 removes the item', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 0 })
    expect(s.items).toEqual([])
  })

  it('setQuantity clamps to 99 and ignores negatives', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 500 })
    expect(s.items[0].quantity).toBe(99)
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: -3 })
    expect(s.items).toEqual([])
  })

  it('clear empties the cart', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'clear' })
    expect(s).toEqual(EMPTY_CART)
  })

  it('does not mutate previous state', () => {
    const s1 = cartReducer(EMPTY_CART, { type: 'add', item: card })
    cartReducer(s1, { type: 'add', item: card })
    expect(s1.items[0].quantity).toBe(1)
  })
})

describe('totals', () => {
  it('cartCount sums quantities', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: lesson })
    expect(cartCount(s)).toBe(3)
  })

  it('cartTotalPence sums price * quantity', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 2 })
    s = cartReducer(s, { type: 'add', item: lesson })
    expect(cartTotalPence(s)).toBe(2 * 1500 + 12500)
  })
})

describe('formatGbp', () => {
  it('formats pence as pounds', () => {
    expect(formatGbp(1500)).toBe('£15.00')
    expect(formatGbp(12550)).toBe('£125.50')
    expect(formatGbp(0)).toBe('£0.00')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/lib/shop/cart.test.ts`
Expected: FAIL — cannot resolve `./cart`.

- [ ] **Step 4: Implement `src/lib/shop/cart.ts`**

```ts
import type { CartAction, CartItem, CartState } from './types'

export const EMPTY_CART: CartState = { items: [] }

const MAX_QUANTITY = 99

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.items.find((i) => i.slug === action.item.slug)
      if (existing) {
        return setQuantity(state, existing.slug, existing.quantity + 1)
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'remove':
      return { items: state.items.filter((i) => i.slug !== action.slug) }
    case 'setQuantity':
      return setQuantity(state, action.slug, action.quantity)
    case 'clear':
      return EMPTY_CART
  }
}

function setQuantity(state: CartState, slug: string, quantity: number): CartState {
  if (quantity <= 0) {
    return { items: state.items.filter((i) => i.slug !== slug) }
  }
  const clamped = Math.min(quantity, MAX_QUANTITY)
  return {
    items: state.items.map((i): CartItem => (i.slug === slug ? { ...i, quantity: clamped } : i)),
  }
}

export function cartCount(state: CartState): number {
  return state.items.reduce((n, i) => n + i.quantity, 0)
}

export function cartTotalPence(state: CartState): number {
  return state.items.reduce((n, i) => n + i.price_pence * i.quantity, 0)
}

export function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/shop/cart.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/shop
git commit -m "feat(shop): cart types, reducer, totals with tests"
```

---

### Task 6: CartProvider context

**Files:**
- Create: `src/components/shop/CartProvider.tsx`
- Modify: `src/app/layout.tsx` (wrap children)

**Interfaces:**
- Consumes: `cartReducer`, `EMPTY_CART` from `@/lib/shop/cart`; types from `@/lib/shop/types`.
- Produces: `CartProvider` (client component) and hook `useCart(): { cart: CartState; dispatch: (action: CartAction) => void }`. Persists to `localStorage` key `aml-cart`. All shop UI and the Header consume `useCart`.

- [ ] **Step 1: Write `src/components/shop/CartProvider.tsx`**

```tsx
'use client'

import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { cartReducer, EMPTY_CART } from '@/lib/shop/cart'
import type { CartAction, CartState } from '@/lib/shop/types'

const STORAGE_KEY = 'aml-cart'

type CartContextValue = {
  cart: CartState
  dispatch: (action: CartAction) => void
}

const CartContext = createContext<CartContextValue | null>(null)

type CartProviderProps = { children: React.ReactNode }

export function CartProvider({ children }: CartProviderProps) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as CartState
        if (Array.isArray(saved.items)) {
          saved.items.forEach((item) => {
            const { quantity, ...rest } = item
            dispatch({ type: 'add', item: rest })
            dispatch({ type: 'setQuantity', slug: item.slug, quantity })
          })
        }
      }
    } catch {
      // corrupted storage — start with an empty cart
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    }
  }, [cart, hydrated])

  return <CartContext.Provider value={{ cart, dispatch }}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
```

- [ ] **Step 2: Wrap the app in `src/app/layout.tsx`**

Add `import { CartProvider } from '@/components/shop/CartProvider'` and change the body to:

```tsx
<body className="antialiased min-h-screen flex flex-col bg-[var(--bg)]">
  <CartProvider>{children}</CartProvider>
</body>
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/shop/CartProvider.tsx src/app/layout.tsx
git commit -m "feat(shop): cart provider with localStorage persistence"
```

---

### Task 7: AML Header and Footer

**Files:**
- Create: `src/components/layout/AmlLogo.tsx`
- Modify: `src/components/layout/Header.tsx` (full rewrite of contents)
- Modify: `src/components/layout/Footer.tsx` (full rewrite of contents)

**Interfaces:**
- Consumes: `useCart`, `cartCount` for the cart badge.
- Produces: `AmlLogo` (`type AmlLogoProps = { inverse?: boolean }`), rebranded `Header`/`Footer` used by `(public)` and `(shop)` layouts. Nav order: Home · Play Online (`/lobby`) · Private Lessons · About · Shop · Discover · London Local · Get in Touch · Cart (`/cart`).

- [ ] **Step 1: Write `src/components/layout/AmlLogo.tsx`**

Text-based logo recreating their branding (no image asset exists for it):

```tsx
import Link from 'next/link'

type AmlLogoProps = { inverse?: boolean }

export function AmlLogo({ inverse }: AmlLogoProps) {
  return (
    <Link
      href="/"
      className={`flex flex-col leading-tight transition-opacity hover:opacity-80 active:opacity-60 ${
        inverse ? 'text-[var(--text-inverse)]' : 'text-[var(--text-primary)]'
      }`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <span className="text-lg sm:text-xl font-bold tracking-wide uppercase">
        American Mahjong
      </span>
      <span className="text-sm sm:text-base font-medium tracking-[0.35em] uppercase text-[var(--accent-warm)]">
        London
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Rewrite `src/components/layout/Header.tsx`**

Two-row desktop header (logo + full nav row, matching the Squarespace layout); mobile keeps hamburger. Keep the existing `'use client'`, `NavLink`/`MobileNavLink` helper pattern:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AmlLogo } from './AmlLogo'
import { useCart } from '@/components/shop/CartProvider'
import { cartCount } from '@/lib/shop/cart'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/lobby', label: 'Play Online' },
  { href: '/private-lessons', label: 'Private Lessons' },
  { href: '/about', label: 'About' },
  { href: '/shop', label: 'Shop' },
  { href: '/discover', label: 'Discover' },
  { href: '/london-local', label: 'London Local' },
  { href: '/get-in-touch', label: 'Get in Touch' },
] as const

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cart } = useCart()
  const count = cartCount(cart)

  return (
    <header
      className="sticky top-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-sm"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <AmlLogo />

        <div className="flex items-center gap-2">
          <Link
            href="/lobby"
            className="hidden sm:inline-flex px-5 h-12 items-center rounded-md text-base font-semibold tracking-wide
              bg-[var(--brand)] text-[var(--text-inverse)]
              hover:bg-[var(--brand-light)] active:bg-[var(--brand-dark)] active:scale-[0.97]
              transition-all duration-150"
          >
            Play Birdy Online — Free
          </Link>
          <CartLink count={count} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-12 h-12 flex items-center justify-center rounded-md
              text-[var(--text-secondary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]
              transition-all duration-150"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" /><line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Desktop nav row */}
      <nav
        className="hidden lg:flex max-w-6xl mx-auto px-6 pb-2 items-center gap-1"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
        ))}
      </nav>

      {/* Mobile / tablet menu */}
      {menuOpen && (
        <nav
          className="lg:hidden border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 flex flex-col gap-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => (
            <MobileNavLink key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </MobileNavLink>
          ))}
          <MobileNavLink href="/cart" onClick={() => setMenuOpen(false)}>
            Cart{count > 0 ? ` (${count})` : ''}
          </MobileNavLink>
        </nav>
      )}
    </header>
  )
}

function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      className="relative w-12 h-12 flex items-center justify-center rounded-md
        text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]
        active:bg-[var(--border)] transition-all duration-150"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 7h12l-1.5 12a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L6 7Z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-5 h-5 px-1 rounded-full bg-[var(--accent-warm)] text-[var(--text-inverse)] text-xs font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 h-12 inline-flex items-center rounded-md text-base font-medium transition-all duration-150
        active:scale-[0.97] text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-card)] active:bg-[var(--border)]"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 rounded-md text-lg font-medium text-[var(--text-secondary)]
        hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]
        transition-all duration-150 min-h-[var(--touch-min)] flex items-center"
    >
      {children}
    </Link>
  )
}
```

- [ ] **Step 3: Rewrite `src/components/layout/Footer.tsx`**

Keep the structure (dark footer, three columns, bottom bar) but rebrand — navy background via `--bg-deep`, AML columns:

```tsx
import Link from 'next/link'
import { AmlLogo } from './AmlLogo'

export function Footer() {
  return (
    <footer className="bg-[var(--bg-deep)] text-[var(--text-inverse)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          <div className="flex flex-col gap-4">
            <AmlLogo inverse />
            <p className="text-[var(--accent-lavender)] text-base leading-relaxed">
              Learn it once, love it forever! Lessons, equipment and free online play —
              American Mahjong in London, with Andrew.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--accent-periwinkle)] font-semibold text-sm uppercase tracking-widest mb-1">
              Explore
            </h4>
            <FooterLink href="/lobby">Play Birdy Online</FooterLink>
            <FooterLink href="/private-lessons">Private Lessons</FooterLink>
            <FooterLink href="/shop">Shop</FooterLink>
            <FooterLink href="/how-to-play">How to Play</FooterLink>
            <FooterLink href="/discover">Discover</FooterLink>
            <FooterLink href="/london-local">London Local</FooterLink>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--accent-periwinkle)] font-semibold text-sm uppercase tracking-widest mb-1">
              Get in Touch
            </h4>
            <a href="mailto:hello@americanmahjonglondon.com" className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors">
              hello@americanmahjonglondon.com
            </a>
            <a href="tel:+447386398249" className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors">
              +44 738 639 8249
            </a>
            <FooterLink href="/get-in-touch">Contact &amp; Newsletter</FooterLink>
            <FooterLink href="/login">Sign In</FooterLink>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--brand-light)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[var(--accent-lavender)] text-sm">
            &copy; {new Date().getFullYear()} American Mahjong | London. All rights reserved.
          </p>
          <p className="text-[var(--accent-lavender)] text-sm">
            Online play powered by Birdy &middot; Official NMJL Card Supported
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors">
      {children}
    </Link>
  )
}
```

Note: the old Footer used a `gold-line` divider class and hardcoded hex — both removed.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`, then `npm run dev` — check header shows AML logo, all 8 nav items + cart icon on desktop; hamburger menu lists everything on a narrow window; footer shows AML columns.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout
git commit -m "feat: AML header, footer, and text logo with cart badge"
```

---

### Task 8: Product catalog helper

**Files:**
- Create: `src/lib/shop/products.ts`

**Interfaces:**
- Consumes: `createServerClient` from `@/lib/supabase/server`, `Product` from `@/lib/shop/types`.
- Produces: `getProducts(): Promise<Product[]>` (active products, lessons first then physical, by price descending) and `getProduct(slug: string): Promise<Product | null>`. Used by shop pages, private-lessons page, and the checkout API.

- [ ] **Step 1: Write `src/lib/shop/products.ts`**

```ts
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
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/shop/products.ts
git commit -m "feat(shop): product catalog helpers"
```

---

### Task 9: AddToCartButton + shop pages (grid, product detail, cart)

**Files:**
- Create: `src/components/shop/AddToCartButton.tsx`
- Create: `src/components/shop/ProductCard.tsx`
- Create: `src/components/shop/CartContents.tsx`
- Create: `src/app/(shop)/layout.tsx`
- Create: `src/app/(shop)/shop/page.tsx`
- Create: `src/app/(shop)/shop/[slug]/page.tsx`
- Create: `src/app/(shop)/cart/page.tsx`

**Interfaces:**
- Consumes: `getProducts`/`getProduct`, `useCart`, `cartTotalPence`, `formatGbp`, `Product`/`CartItem` types, `Header`/`Footer`.
- Produces: routes `/shop`, `/shop/[slug]`, `/cart`. `CartContents` posts to `POST /api/checkout` with body `{ items: [{ slug, quantity }] }` and expects `{ url: string }` back (implemented in Task 14 — the button shows an error until then).

- [ ] **Step 1: Write `src/app/(shop)/layout.tsx`**

```tsx
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Write `src/components/shop/AddToCartButton.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useCart } from './CartProvider'
import type { Product } from '@/lib/shop/types'

type AddToCartButtonProps = { product: Product }

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { dispatch } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    dispatch({
      type: 'add',
      item: {
        slug: product.slug,
        name: product.name,
        price_pence: product.price_pence,
        image: product.image,
        type: product.type,
      },
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      className="px-6 h-12 rounded-md text-lg font-semibold tracking-wide
        bg-[var(--brand)] text-[var(--text-inverse)]
        hover:bg-[var(--brand-light)] active:bg-[var(--brand-dark)] active:scale-[0.97]
        transition-all duration-150"
    >
      {added ? 'Added ✓' : 'Add to Cart'}
    </button>
  )
}
```

- [ ] **Step 3: Write `src/components/shop/ProductCard.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { formatGbp } from '@/lib/shop/cart'
import type { Product } from '@/lib/shop/types'

type ProductCardProps = { product: Product }

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="flex flex-col rounded-md border border-[var(--border)] bg-[var(--bg-elevated)]
        overflow-hidden hover:border-[var(--border-strong)] active:scale-[0.99] transition-all duration-150"
    >
      <div className="relative aspect-square bg-[var(--accent-blush)]">
        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
      </div>
      <div className="p-5 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          {product.name}
        </h3>
        <p className="text-xl font-bold text-[var(--accent-warm)]">{formatGbp(product.price_pence)}</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Write `src/app/(shop)/shop/page.tsx`**

```tsx
import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'

export const metadata = { title: 'Shop — American Mahjong | London' }
export const revalidate = 300

export default async function ShopPage() {
  const products = await getProducts()
  const lessons = products.filter((p) => p.type === 'lesson')
  const physical = products.filter((p) => p.type === 'physical')

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Shop
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          Everything you need to play American Mahjong — the official NMJL card, scorecards, and
          lessons with Andrew.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Lessons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Equipment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {physical.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="rounded-md bg-[var(--accent-lavender)] p-6 sm:p-8 flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Free Downloadable Scorecards
        </h2>
        <p className="text-lg text-[var(--text-secondary)]">Print at home and keep score the easy way.</p>
        <div className="flex flex-wrap gap-4 mt-2">
          <a href="/aml/downloads/scorecard-landscape.pdf" download
            className="px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
            Landscape PDF
          </a>
          <a href="/aml/downloads/scorecard-portrait.pdf" download
            className="px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
            Portrait PDF
          </a>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/app/(shop)/shop/[slug]/page.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/shop/products'
import { formatGbp } from '@/lib/shop/cart'
import { AddToCartButton } from '@/components/shop/AddToCartButton'

export const revalidate = 300

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
      <Link href="/shop" className="text-lg text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
        &larr; Back to Shop
      </Link>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="relative aspect-square rounded-md overflow-hidden bg-[var(--accent-blush)]">
          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
        </div>
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {product.name}
          </h1>
          <p className="text-3xl font-bold text-[var(--accent-warm)]">{formatGbp(product.price_pence)}</p>
          <p className="text-lg leading-relaxed text-[var(--text-secondary)]">{product.description}</p>
          {product.type === 'lesson' && (
            <p className="text-base text-[var(--text-muted)]">
              After purchase, Andrew will contact you by email to arrange a time that suits you.
            </p>
          )}
          <div className="mt-2"><AddToCartButton product={product} /></div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write `src/components/shop/CartContents.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { cartTotalPence, formatGbp } from '@/lib/shop/cart'

export function CartContents() {
  const { cart, dispatch } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.items.map((i) => ({ slug: i.slug, quantity: i.quantity })) }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — please try again.')
      setSubmitting(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-xl text-[var(--text-secondary)]">Your cart is empty.</p>
        <Link href="/shop" className="px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Browse the Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {cart.items.map((item) => (
          <li key={item.slug} className="py-5 flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-[var(--accent-blush)] shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-[var(--text-primary)]">{item.name}</p>
              <p className="text-base text-[var(--text-secondary)]">{formatGbp(item.price_pence)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <QuantityButton label={`Decrease quantity of ${item.name}`} onClick={() => dispatch({ type: 'setQuantity', slug: item.slug, quantity: item.quantity - 1 })}>−</QuantityButton>
              <span className="w-8 text-center text-lg font-semibold text-[var(--text-primary)]">{item.quantity}</span>
              <QuantityButton label={`Increase quantity of ${item.name}`} onClick={() => dispatch({ type: 'setQuantity', slug: item.slug, quantity: item.quantity + 1 })}>+</QuantityButton>
            </div>
            <button
              onClick={() => dispatch({ type: 'remove', slug: item.slug })}
              className="ml-2 px-3 h-12 rounded-md text-base font-medium text-[var(--error)] hover:bg-[var(--error-light)] active:scale-[0.97] transition-all duration-150"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-[var(--border-strong)] pt-5">
        <p className="text-xl font-bold text-[var(--text-primary)]">Total</p>
        <p className="text-2xl font-bold text-[var(--accent-warm)]">{formatGbp(cartTotalPence(cart))}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-[var(--error-light)] text-[var(--error)] px-4 py-3 text-lg">{error}</p>
      )}

      <button
        onClick={handleCheckout}
        disabled={submitting}
        className="h-14 rounded-md text-xl font-bold tracking-wide bg-[var(--brand)] text-[var(--text-inverse)]
          hover:bg-[var(--brand-light)] active:bg-[var(--brand-dark)] active:scale-[0.98]
          disabled:opacity-60 disabled:pointer-events-none transition-all duration-150"
      >
        {submitting ? 'Taking you to secure checkout…' : 'Checkout Securely'}
      </button>
      <p className="text-base text-[var(--text-muted)] text-center">
        Payments are processed securely by Stripe. Lessons: Andrew will email you to schedule.
      </p>
    </div>
  )
}

function QuantityButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-12 h-12 rounded-md border border-[var(--border-strong)] text-xl font-bold text-[var(--text-primary)]
        hover:bg-[var(--bg-card)] active:bg-[var(--border)] active:scale-[0.95] transition-all duration-150"
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 7: Write `src/app/(shop)/cart/page.tsx`**

```tsx
import { CartContents } from '@/components/shop/CartContents'

export const metadata = { title: 'Cart — American Mahjong | London' }

export default function CartPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Your Cart
      </h1>
      <CartContents />
    </div>
  )
}
```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit && npm run build`, then `npm run dev`: visit `/shop` (needs Supabase env for products — if not connected, the page errors; that's expected until env is set, note it in the report), add items on a product page, confirm the header badge counts up, `/cart` shows items, quantities edit, totals correct, checkout button shows an error (API not built yet).

- [ ] **Step 9: Commit**

```bash
git add "src/app/(shop)" src/components/shop
git commit -m "feat(shop): shop grid, product pages, cart page with quantity editing"
```

---

### Task 10: Content pages — Home, Private Lessons, About

**Files:**
- Create: `src/app/(public)/page.tsx` (new AML homepage — check first: if a homepage exists at `src/app/page.tsx`, replace THAT file instead and keep only one root page)
- Create: `src/app/(public)/private-lessons/page.tsx`
- Modify: `src/app/(public)/about/page.tsx` (full rewrite of contents)

**Interfaces:**
- Consumes: `getProducts`, `ProductCard`, image paths from Task 2.
- Produces: routes `/`, `/private-lessons`, rebuilt `/about`.

- [ ] **Step 1: Locate the existing homepage**

Run: `ls src/app/page.tsx "src/app/(public)/page.tsx" 2>/dev/null`
Whichever exists is the file to rewrite (there must be exactly one root page).

- [ ] **Step 2: Write the AML homepage**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'

export const revalidate = 300

export default async function HomePage() {
  const products = await getProducts()
  const lessons = products.filter((p) => p.type === 'lesson')

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-[var(--accent-blush)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Learn American Mahjong
            </h1>
            <p className="text-2xl text-[var(--accent-warm)] font-semibold">with Andrew</p>
            <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
              Learn it once, love it forever! Private lessons in London, official NMJL equipment,
              and now — play online for free, any time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/lobby" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
                Play Birdy Online — Free
              </Link>
              <Link href="/private-lessons" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-subtle)] active:scale-[0.97] transition-all duration-150">
                Book a Lesson
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-md overflow-hidden">
            <Image src="/aml/hero.jpeg" alt="Andrew teaching American Mahjong in London" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-square rounded-md overflow-hidden order-last md:order-first">
          <Image src="/aml/how-it-works.png" alt="American Mahjong tiles laid out for a lesson" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            How It Works
          </h2>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Book a session and Andrew brings everything to you — tiles, cards, and a complete
            guide to take home. Learn the tiles, the rules, and how to build winning hands at
            your own pace. Then keep playing between lessons with Birdy, our free online game.
          </p>
          <Link href="/how-to-play" className="text-xl font-semibold text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            New to the game? Read how to play &rarr;
          </Link>
        </div>
      </section>

      {/* Lessons */}
      <section className="bg-[var(--accent-lavender)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 flex flex-col gap-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Lessons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      </section>

      {/* About mahjong */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            About Mahjong
          </h2>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Mahjong is a tile game that began in Shanghai in the 1800s and grew into distinct
            regional styles. American Mahjong is its own game — played with 152 tiles, jokers,
            and a standardised card of winning hands updated every April by the National Mah
            Jongg League, founded in 1937.
          </p>
          <Link href="/about" className="text-xl font-semibold text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            More about the game and Andrew &rarr;
          </Link>
        </div>
        <div className="relative aspect-square rounded-md overflow-hidden">
          <Image src="/aml/tiles-1.png" alt="American Mahjong tiles" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      </section>
    </div>
  )
}
```

If the homepage lives at `src/app/page.tsx` (outside `(public)`), it won't have Header/Footer from the `(public)` layout — in that case move it: create `src/app/(public)/page.tsx` with this content and delete `src/app/page.tsx`.

- [ ] **Step 3: Write `src/app/(public)/private-lessons/page.tsx`**

```tsx
import Link from 'next/link'
import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'

export const metadata = { title: 'Private Lessons — American Mahjong | London' }
export const revalidate = 300

export default async function PrivateLessonsPage() {
  const lessons = (await getProducts()).filter((p) => p.type === 'lesson')

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Private Lessons
        </h1>
        <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
          Learn American Mahjong with Andrew — one to one or with friends, at your pace.
          Every session includes a complete guide to take home and return to anytime.
          After booking, Andrew will email you to arrange a time that suits you.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>

      <section className="rounded-md bg-[var(--accent-blush)] p-6 sm:p-8 flex flex-col gap-3 max-w-3xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Practice between lessons — free
        </h2>
        <p className="text-lg text-[var(--text-secondary)]">
          Keep what you learn fresh by playing Birdy, our free online American Mahjong game.
        </p>
        <Link href="/lobby" className="self-start px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Play Birdy Online
        </Link>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `src/app/(public)/about/page.tsx`**

Replace the existing file's contents entirely:

```tsx
import Image from 'next/image'
import Link from 'next/link'

export const metadata = { title: 'About — American Mahjong | London' }

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-16">
      {/* Andrew */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/5] rounded-md overflow-hidden">
          <Image src="/aml/andrew.jpeg" alt="Andrew Robson, founder of American Mahjong London" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
        </div>
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            About Andrew
          </h1>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Andrew Robson grew up in South Africa, where he studied PPE, before moving to
            London to study Law. He discovered American Mahjong while travelling across the
            United States — and fell for the game completely.
          </p>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            He founded American Mahjong | London with the hope of bringing that experience to
            others: making the game more accessible in London through lessons, equipment, and
            a growing community of players. Learn it once, love it forever!
          </p>
        </div>
      </section>

      {/* The game */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            About the Game
          </h2>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Mahjong began in Shanghai in the 1800s and spread into distinct regional styles —
            Hong Kong, Japanese riichi, and American among them. American Mahjong is played
            with 152 tiles including jokers, and a standardised card of winning hands published
            every April by the{' '}
            <a href="https://www.nationalmahjonggleague.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-dark)]">
              National Mah Jongg League
            </a>
            , founded in 1937.
          </p>
          <Link href="/how-to-play" className="text-xl font-semibold text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            How to play &rarr;
          </Link>
        </div>
        <div className="relative aspect-square rounded-md overflow-hidden">
          <Image src="/aml/tiles-2.png" alt="Close-up of American Mahjong tiles" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      </section>

      {/* Play online */}
      <section className="rounded-md bg-[var(--accent-lavender)] p-8 sm:p-12 flex flex-col items-center gap-5 text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Play Online with Birdy
        </h2>
        <p className="text-xl leading-relaxed text-[var(--text-secondary)] max-w-2xl">
          Birdy is our free online American Mahjong game — real NMJL rules, the Charleston,
          jokers and all. Play with friends or against friendly bots, any time.
        </p>
        <Link href="/lobby" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Play Birdy Online — Free
        </Link>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`, then visually check `/`, `/private-lessons`, `/about` in the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A src/app
git commit -m "feat: AML homepage, private lessons, and about pages"
```

---

### Task 11: Content pages — Discover, London Local

**Files:**
- Create: `src/app/(public)/discover/page.tsx`
- Create: `src/app/(public)/london-local/page.tsx`

**Interfaces:**
- Consumes: theme tokens only. All links are external (open in new tab).
- Produces: routes `/discover`, `/london-local`.

- [ ] **Step 1: Write `src/app/(public)/discover/page.tsx`**

```tsx
export const metadata = { title: 'Discover — American Mahjong | London' }

type Article = { title: string; source: string; blurb: string; href: string }

const FEATURES: Article[] = [
  {
    title: 'The Benefits of Mahjong',
    source: 'Martha Stewart',
    blurb: 'Why mahjong is having a moment — brain health, healthy aging, and connection.',
    href: 'https://www.marthastewart.com/benefits-of-mahjong-11871810',
  },
  {
    title: 'How to Play American Mahjong: The Complete Guide',
    source: 'Dear Asia London',
    blurb: 'A thorough written walkthrough of the American game, from tiles to winning hands.',
    href: 'https://mahjong.dearasia.co.uk/how-to-play-american-mahjong-complete-guide/',
  },
  {
    title: 'Order Out of Chaos',
    source: 'Smithsonian Magazine',
    blurb: 'The Asian game of mahjong, which creates order out of chaos, is trending in the West.',
    href: 'https://www.smithsonianmag.com/arts-culture/the-asian-game-of-mahjong-which-creates-order-out-of-chaos-is-trending-in-the-west-180986021/',
  },
]

const NEWS: Article[] = [
  {
    title: 'Young people all over the world are clicking with mahjong',
    source: 'The Economist',
    blurb: 'A new generation discovers the game.',
    href: 'https://www.economist.com/culture/2026/03/25/young-people-all-over-the-world-are-clicking-with-mahjong',
  },
  {
    title: 'Mahjong and the new card games',
    source: 'Boston Globe',
    blurb: 'Why tile and card nights are back.',
    href: 'https://www.bostonglobe.com/2026/03/23/lifestyle/mahjong-new-card-games/',
  },
  {
    title: 'Mahjong on the rise',
    source: 'Financial Times',
    blurb: 'The FT on the game’s resurgence.',
    href: 'https://www.ft.com/content/27dae2e7-b07c-4960-ae95-8588de374bee',
  },
  {
    title: 'Mah Jongg in DC',
    source: 'Washington Post',
    blurb: 'How the game is bringing people together.',
    href: 'https://www.washingtonpost.com/dc-md-va/2025/07/24/mah-jongg-dc/',
  },
  {
    title: 'Mahjong’s modern makeover',
    source: 'Vogue',
    blurb: 'The style world embraces the tiles.',
    href: 'https://www.vogue.com/article/mahjong-modern-makeover',
  },
  {
    title: 'Your mahjong game night hosting guide',
    source: 'Martha Stewart',
    blurb: 'Hosting a mahjong night, done properly.',
    href: 'https://www.marthastewart.com/mahjong-game-night-hosting-guide-11859541',
  },
]

export default function DiscoverPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-12">
      <header className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Everything Mahjong
        </h1>
        <p className="text-xl text-[var(--text-secondary)]">
          Reading, watching, and rabbit holes — our favourite mahjong resources from around the web.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((a) => <ArticleCard key={a.href} article={a} />)}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Mahj in the News
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {NEWS.map((a) => <ArticleCard key={a.href} article={a} />)}
        </div>
      </section>
    </div>
  )
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-6
        hover:border-[var(--border-strong)] active:scale-[0.99] transition-all duration-150"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent-warm)]">{article.source}</p>
      <h3 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{article.title}</h3>
      <p className="text-lg text-[var(--text-secondary)]">{article.blurb}</p>
      <span className="text-lg font-semibold text-[var(--accent-gold)]">Read &rarr;</span>
    </a>
  )
}
```

All hrefs above are the real article URLs extracted from the live AML site.

- [ ] **Step 2: Write `src/app/(public)/london-local/page.tsx`**

```tsx
export const metadata = { title: 'London Local — American Mahjong | London' }

type Club = { name: string; area: string; blurb: string; href: string }

const CLUBS: Club[] = [
  {
    name: 'Sik Wu',
    area: 'Kentish Town',
    blurb: 'Mahjong events and social play in a friendly setting.',
    href: 'https://sikfaan.com/mahjong-events/',
  },
  {
    name: 'Dear Asia London',
    area: 'Aldgate',
    blurb: 'A social mahjong club with classes, events, and a great community.',
    href: 'https://mahjong.dearasia.co.uk/london-mahjong-social-club/',
  },
  {
    name: '4 Winds Mahjong Club',
    area: 'Dalston & Camden',
    blurb: 'Regular meetups for mahjong players of all levels.',
    href: 'https://www.fourwindsmahjong.club/',
  },
]

export default function LondonLocalPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          London Local
        </h1>
        <p className="text-xl text-[var(--text-secondary)]">
          Mahjong is better together. These London clubs and communities are well worth a visit —
          different styles, same joy.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLUBS.map((club) => (
          <a
            key={club.href}
            href={club.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-6
              hover:border-[var(--border-strong)] active:scale-[0.99] transition-all duration-150"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent-warm)]">{club.area}</p>
            <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{club.name}</h2>
            <p className="text-lg text-[var(--text-secondary)]">{club.blurb}</p>
            <span className="text-lg font-semibold text-[var(--accent-gold)]">Visit &rarr;</span>
          </a>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit`, check both pages in the dev server, then:

```bash
git add "src/app/(public)/discover" "src/app/(public)/london-local"
git commit -m "feat: discover and london local pages"
```

---

### Task 12: Get in Touch — contact form, contact API, newsletter API

**Files:**
- Create: `src/app/(public)/get-in-touch/page.tsx`
- Create: `src/components/ui/ContactForm.tsx`
- Create: `src/components/ui/NewsletterForm.tsx`
- Create: `src/app/api/contact/route.ts`
- Create: `src/app/api/newsletter/route.ts`
- Create: `src/lib/email/send.ts`
- Test: `src/lib/email/send.test.ts`

**Interfaces:**
- Consumes: `createServiceClient` from `@/lib/supabase/server`.
- Produces:
  - `sendEmail(opts: { to: string; subject: string; text: string; replyTo?: string }): Promise<void>` — POSTs to the Resend REST API (`https://api.resend.com/emails`) with `RESEND_API_KEY`; from address `American Mahjong London <onboarding@resend.dev>` until a domain is verified. Also `NOTIFY_EMAIL` const = `process.env.ORDER_NOTIFY_EMAIL ?? 'hello@americanmahjonglondon.com'`. Task 14 (webhook) reuses both.
  - `validateContact(body: unknown): { name: string; email: string; message: string } | null` — exported for tests.
  - `POST /api/contact` `{ name, email, message, website? }` → 200 `{ ok: true }` (the `website` field is a honeypot: if non-empty, return 200 without sending).
  - `POST /api/newsletter` `{ email }` → 200 `{ ok: true }`; duplicate email also returns 200.

- [ ] **Step 1: Write the failing tests `src/lib/email/send.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { validateContact } from './send'

describe('validateContact', () => {
  it('accepts a valid submission', () => {
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hello there' }))
      .toEqual({ name: 'Ann', email: 'ann@example.com', message: 'Hello there' })
  })
  it('rejects missing fields', () => {
    expect(validateContact({ name: 'Ann', email: 'ann@example.com' })).toBeNull()
    expect(validateContact(null)).toBeNull()
    expect(validateContact('nope')).toBeNull()
  })
  it('rejects invalid email', () => {
    expect(validateContact({ name: 'Ann', email: 'not-an-email', message: 'Hi' })).toBeNull()
  })
  it('rejects oversized message', () => {
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'x'.repeat(5001) })).toBeNull()
  })
  it('trims whitespace', () => {
    expect(validateContact({ name: '  Ann ', email: ' ann@example.com ', message: ' Hi there ' }))
      .toEqual({ name: 'Ann', email: 'ann@example.com', message: 'Hi there' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/email/send.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/email/send.ts`**

```ts
export const NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL ?? 'hello@americanmahjonglondon.com'

const FROM = 'American Mahjong London <onboarding@resend.dev>'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SendEmailOptions = { to: string; subject: string; text: string; replyTo?: string }

export async function sendEmail({ to, subject, text, replyTo }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`)
  }
}

export type ContactSubmission = { name: string; email: string; message: string }

export function validateContact(body: unknown): ContactSubmission | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || typeof b.email !== 'string' || typeof b.message !== 'string') return null
  const name = b.name.trim()
  const email = b.email.trim()
  const message = b.message.trim()
  if (!name || name.length > 200) return null
  if (!EMAIL_RE.test(email) || email.length > 320) return null
  if (!message || message.length > 5000) return null
  return { name, email, message }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/email/send.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/app/api/contact/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { sendEmail, validateContact, NOTIFY_EMAIL } from '@/lib/email/send'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot: bots fill every field; humans never see this one.
  if (typeof body === 'object' && body !== null && (body as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true })
  }

  const submission = validateContact(body)
  if (!submission) {
    return NextResponse.json({ error: 'Please fill in your name, a valid email, and a message.' }, { status: 400 })
  }

  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      subject: `Website enquiry from ${submission.name}`,
      text: `Name: ${submission.name}\nEmail: ${submission.email}\n\n${submission.message}`,
      replyTo: submission.email,
    })
  } catch (e) {
    console.error('contact form send failed', e)
    return NextResponse.json({ error: 'Sorry, we could not send your message. Please email us directly.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Write `src/app/api/newsletter/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const email =
    typeof body === 'object' && body !== null && typeof (body as Record<string, unknown>).email === 'string'
      ? ((body as Record<string, unknown>).email as string).trim()
      : ''
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('newsletter_subscribers').insert({ email })
  if (error && !error.message.includes('duplicate')) {
    console.error('newsletter insert failed', error)
    return NextResponse.json({ error: 'Sorry, something went wrong. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Write `src/components/ui/ContactForm.tsx`**

```tsx
'use client'

import { useState } from 'react'

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const data = new FormData(form)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        email: data.get('email'),
        message: data.get('message'),
        website: data.get('website'),
      }),
    }).catch(() => null)
    if (res?.ok) {
      setStatus('sent')
      form.reset()
    } else {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null
      setErrorMsg(body?.error ?? 'Sorry, we could not send your message. Please email us directly.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p role="status" className="rounded-md bg-[var(--success-light)] text-[var(--success)] px-5 py-4 text-xl">
        Thank you — your message is on its way. Andrew will get back to you soon.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Your name
        <input name="name" required maxLength={200}
          className="h-12 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-lg text-[var(--text-primary)]" />
      </label>
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Your email
        <input name="email" type="email" required maxLength={320}
          className="h-12 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-lg text-[var(--text-primary)]" />
      </label>
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Message
        <textarea name="message" required maxLength={5000} rows={6}
          className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3 text-lg text-[var(--text-primary)]" />
      </label>
      {/* Honeypot — hidden from humans, catnip for bots */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {status === 'error' && (
        <p role="alert" className="rounded-md bg-[var(--error-light)] text-[var(--error)] px-4 py-3 text-lg">{errorMsg}</p>
      )}
      <button type="submit" disabled={status === 'sending'}
        className="h-14 rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)]
          hover:bg-[var(--brand-light)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all duration-150">
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
```

- [ ] **Step 8: Write `src/components/ui/NewsletterForm.tsx`**

```tsx
'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const data = new FormData(e.currentTarget)
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.get('email') }),
    }).catch(() => null)
    setStatus(res?.ok ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <p role="status" className="rounded-md bg-[var(--success-light)] text-[var(--success)] px-5 py-4 text-xl">
        You&apos;re on the list — welcome!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" name="email" type="email" required placeholder="you@example.com"
        className="h-12 flex-1 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-lg text-[var(--text-primary)]" />
      <button type="submit" disabled={status === 'sending'}
        className="h-12 px-6 rounded-md text-lg font-bold bg-[var(--accent-warm)] text-[var(--text-inverse)]
          hover:bg-[var(--accent-warm-light)] active:scale-[0.97] disabled:opacity-60 transition-all duration-150">
        {status === 'sending' ? 'Joining…' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p role="alert" className="text-[var(--error)] text-lg sm:self-center">Please try again.</p>
      )}
    </form>
  )
}
```

- [ ] **Step 9: Write `src/app/(public)/get-in-touch/page.tsx`**

```tsx
import { ContactForm } from '@/components/ui/ContactForm'
import { NewsletterForm } from '@/components/ui/NewsletterForm'

export const metadata = { title: 'Get in Touch — American Mahjong | London' }

export default function GetInTouchPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Get in Touch
        </h1>
        <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
          Questions about lessons, orders, or the game? Send a message and Andrew will get
          back to you.
        </p>
        <div className="flex flex-col gap-2 text-xl">
          <a href="mailto:hello@americanmahjonglondon.com" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            hello@americanmahjonglondon.com
          </a>
          <a href="tel:+447386398249" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            +44 738 639 8249
          </a>
        </div>
        <div className="mt-4 rounded-md bg-[var(--accent-blush)] p-6 flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Join the newsletter
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">Events, new products, and mahjong news — no spam.</p>
          <NewsletterForm />
        </div>
      </div>
      <ContactForm />
    </div>
  )
}
```

- [ ] **Step 10: Verify and commit**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green. In dev, submit the form without env vars set — expect the friendly 502 error message (correct behavior until `RESEND_API_KEY` exists).

```bash
git add src/lib/email src/app/api/contact src/app/api/newsletter src/components/ui "src/app/(public)/get-in-touch"
git commit -m "feat: get in touch page with contact form and newsletter signup"
```

---

### Task 13: Checkout line-item builder (pure logic + tests)

**Files:**
- Create: `src/lib/shop/checkout.ts`
- Test: `src/lib/shop/checkout.test.ts`

**Interfaces:**
- Consumes: `Product` from `@/lib/shop/types`.
- Produces:
  - `type CheckoutRequestItem = { slug: string; quantity: number }`
  - `type LineItem = { price_data: { currency: 'gbp'; unit_amount: number; product_data: { name: string; images: string[] } }; quantity: number }`
  - `buildLineItems(items: CheckoutRequestItem[], products: Product[], siteUrl: string): LineItem[]` — throws `CheckoutError` (exported, `message` is user-safe) on: empty cart, unknown slug, quantity not an integer in 1..99.
  - `hasPhysicalItems(items: CheckoutRequestItem[], products: Product[]): boolean`
  - `parseCheckoutRequest(body: unknown): CheckoutRequestItem[] | null`

- [ ] **Step 1: Write the failing tests `src/lib/shop/checkout.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildLineItems, hasPhysicalItems, parseCheckoutRequest, CheckoutError } from './checkout'
import type { Product } from './types'

const products: Product[] = [
  { id: '1', slug: 'nmjl-card-2026', name: '2026 Official NMJL Card (Large Print)', description: '', price_pence: 1500, type: 'physical', image: '/aml/nmjl-card-2026.png', active: true },
  { id: '2', slug: 'private-session-1-hour', name: 'Private Session (1 Hour)', description: '', price_pence: 12500, type: 'lesson', image: '/aml/lesson-1-hour.png', active: true },
]
const SITE = 'https://example.com'

describe('buildLineItems', () => {
  it('builds Stripe line items with server-side prices', () => {
    const items = buildLineItems([{ slug: 'nmjl-card-2026', quantity: 2 }], products, SITE)
    expect(items).toEqual([
      {
        price_data: {
          currency: 'gbp',
          unit_amount: 1500,
          product_data: { name: '2026 Official NMJL Card (Large Print)', images: ['https://example.com/aml/nmjl-card-2026.png'] },
        },
        quantity: 2,
      },
    ])
  })

  it('throws on unknown slug', () => {
    expect(() => buildLineItems([{ slug: 'nope', quantity: 1 }], products, SITE)).toThrow(CheckoutError)
  })

  it('throws on empty cart', () => {
    expect(() => buildLineItems([], products, SITE)).toThrow(CheckoutError)
  })

  it('throws on bad quantities', () => {
    expect(() => buildLineItems([{ slug: 'nmjl-card-2026', quantity: 0 }], products, SITE)).toThrow(CheckoutError)
    expect(() => buildLineItems([{ slug: 'nmjl-card-2026', quantity: 1.5 }], products, SITE)).toThrow(CheckoutError)
    expect(() => buildLineItems([{ slug: 'nmjl-card-2026', quantity: 100 }], products, SITE)).toThrow(CheckoutError)
  })
})

describe('hasPhysicalItems', () => {
  it('true when any item is physical', () => {
    expect(hasPhysicalItems([{ slug: 'nmjl-card-2026', quantity: 1 }], products)).toBe(true)
  })
  it('false for lessons only', () => {
    expect(hasPhysicalItems([{ slug: 'private-session-1-hour', quantity: 1 }], products)).toBe(false)
  })
})

describe('parseCheckoutRequest', () => {
  it('parses a valid body', () => {
    expect(parseCheckoutRequest({ items: [{ slug: 'a', quantity: 2 }] })).toEqual([{ slug: 'a', quantity: 2 }])
  })
  it('rejects malformed bodies', () => {
    expect(parseCheckoutRequest(null)).toBeNull()
    expect(parseCheckoutRequest({})).toBeNull()
    expect(parseCheckoutRequest({ items: 'x' })).toBeNull()
    expect(parseCheckoutRequest({ items: [{ slug: 5, quantity: 1 }] })).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/shop/checkout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/shop/checkout.ts`**

```ts
import type { Product } from './types'

export class CheckoutError extends Error {}

export type CheckoutRequestItem = { slug: string; quantity: number }

export type LineItem = {
  price_data: {
    currency: 'gbp'
    unit_amount: number
    product_data: { name: string; images: string[] }
  }
  quantity: number
}

export function parseCheckoutRequest(body: unknown): CheckoutRequestItem[] | null {
  if (typeof body !== 'object' || body === null) return null
  const items = (body as Record<string, unknown>).items
  if (!Array.isArray(items)) return null
  const parsed: CheckoutRequestItem[] = []
  for (const raw of items) {
    if (typeof raw !== 'object' || raw === null) return null
    const { slug, quantity } = raw as Record<string, unknown>
    if (typeof slug !== 'string' || typeof quantity !== 'number') return null
    parsed.push({ slug, quantity })
  }
  return parsed
}

export function buildLineItems(
  items: CheckoutRequestItem[],
  products: Product[],
  siteUrl: string
): LineItem[] {
  if (items.length === 0) throw new CheckoutError('Your cart is empty.')
  return items.map((item) => {
    const product = products.find((p) => p.slug === item.slug)
    if (!product) throw new CheckoutError('An item in your cart is no longer available.')
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new CheckoutError('Invalid quantity.')
    }
    return {
      price_data: {
        currency: 'gbp' as const,
        unit_amount: product.price_pence,
        product_data: { name: product.name, images: [`${siteUrl}${product.image}`] },
      },
      quantity: item.quantity,
    }
  })
}

export function hasPhysicalItems(items: CheckoutRequestItem[], products: Product[]): boolean {
  return items.some((item) => products.find((p) => p.slug === item.slug)?.type === 'physical')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/shop/checkout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shop/checkout.ts src/lib/shop/checkout.test.ts
git commit -m "feat(shop): checkout line-item builder with server-side pricing"
```

---

### Task 14: Stripe checkout API + webhook + success page

**Files:**
- Modify: `package.json` (add `stripe`)
- Create: `src/app/api/checkout/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`
- Create: `src/app/(shop)/checkout/success/page.tsx`
- Create: `src/lib/shop/orders.ts`
- Test: `src/lib/shop/orders.test.ts`

**Interfaces:**
- Consumes: `buildLineItems`, `hasPhysicalItems`, `parseCheckoutRequest`, `CheckoutError` from `@/lib/shop/checkout`; `getProducts`; `createServiceClient`; `sendEmail`, `NOTIFY_EMAIL` from `@/lib/email/send`.
- Produces:
  - `POST /api/checkout` → `{ url }` (303-style redirect target) or `{ error }` with status 400/500.
  - `POST /api/stripe/webhook` → Stripe webhook receiver.
  - `orderRowFromSession(session: SessionLike): OrderRow` in `src/lib/shop/orders.ts` where `type SessionLike = { id: string; amount_total: number | null; customer_details: { email: string | null; name: string | null } | null; collected_information?: { shipping_details?: { address?: object; name?: string } | null } | null; metadata: Record<string, string> | null }` and `type OrderRow = { stripe_session_id: string; customer_email: string; customer_name: string | null; shipping_address: object | null; items: CheckoutRequestItem[]; total_pence: number; user_id: string | null }`. Throws if email or metadata items are missing.
  - `/checkout/success` page that clears the cart.

- [ ] **Step 1: Install Stripe SDK**

```bash
npm install stripe
```

- [ ] **Step 2: Write the failing tests `src/lib/shop/orders.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { orderRowFromSession } from './orders'

const base = {
  id: 'cs_test_123',
  amount_total: 4000,
  customer_details: { email: 'buyer@example.com', name: 'Buyer Person' },
  metadata: { items: JSON.stringify([{ slug: 'nmjl-card-2026', quantity: 2 }]), user_id: '' },
}

describe('orderRowFromSession', () => {
  it('maps a completed session to an order row', () => {
    const row = orderRowFromSession({
      ...base,
      collected_information: { shipping_details: { address: { line1: '1 Test St', country: 'GB' }, name: 'Buyer Person' } },
    })
    expect(row).toEqual({
      stripe_session_id: 'cs_test_123',
      customer_email: 'buyer@example.com',
      customer_name: 'Buyer Person',
      shipping_address: { line1: '1 Test St', country: 'GB' },
      items: [{ slug: 'nmjl-card-2026', quantity: 2 }],
      total_pence: 4000,
      user_id: null,
    })
  })

  it('handles missing shipping (lesson-only orders)', () => {
    const row = orderRowFromSession(base)
    expect(row.shipping_address).toBeNull()
  })

  it('records user_id when present in metadata', () => {
    const row = orderRowFromSession({ ...base, metadata: { ...base.metadata, user_id: 'uuid-1' } })
    expect(row.user_id).toBe('uuid-1')
  })

  it('throws when email is missing', () => {
    expect(() => orderRowFromSession({ ...base, customer_details: null })).toThrow()
  })

  it('throws when items metadata is missing', () => {
    expect(() => orderRowFromSession({ ...base, metadata: null })).toThrow()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/lib/shop/orders.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/lib/shop/orders.ts`**

```ts
import type { CheckoutRequestItem } from './checkout'

export type SessionLike = {
  id: string
  amount_total: number | null
  customer_details: { email: string | null; name: string | null } | null
  collected_information?: { shipping_details?: { address?: object; name?: string } | null } | null
  metadata: Record<string, string> | null
}

export type OrderRow = {
  stripe_session_id: string
  customer_email: string
  customer_name: string | null
  shipping_address: object | null
  items: CheckoutRequestItem[]
  total_pence: number
  user_id: string | null
}

export function orderRowFromSession(session: SessionLike): OrderRow {
  const email = session.customer_details?.email
  if (!email) throw new Error(`Session ${session.id} has no customer email`)
  const rawItems = session.metadata?.items
  if (!rawItems) throw new Error(`Session ${session.id} has no items metadata`)
  return {
    stripe_session_id: session.id,
    customer_email: email,
    customer_name: session.customer_details?.name ?? null,
    shipping_address: session.collected_information?.shipping_details?.address ?? null,
    items: JSON.parse(rawItems) as CheckoutRequestItem[],
    total_pence: session.amount_total ?? 0,
    user_id: session.metadata?.user_id || null,
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/shop/orders.test.ts`
Expected: PASS.

- [ ] **Step 6: Write `src/app/api/checkout/route.ts`**

```ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProducts } from '@/lib/shop/products'
import { buildLineItems, hasPhysicalItems, parseCheckoutRequest, CheckoutError } from '@/lib/shop/checkout'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'Checkout is not available right now.' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const items = parseCheckoutRequest(body)
  if (!items) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const products = await getProducts()
    const lineItems = buildLineItems(items, products, siteUrl)
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success`,
      cancel_url: `${siteUrl}/cart`,
      metadata: { items: JSON.stringify(items) },
      ...(hasPhysicalItems(items, products)
        ? { shipping_address_collection: { allowed_countries: ['GB'] } }
        : {}),
    })
    if (!session.url) throw new Error('Stripe session has no URL')
    return NextResponse.json({ url: session.url })
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('checkout failed', e)
    return NextResponse.json({ error: 'Checkout failed — please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Write `src/app/api/stripe/webhook/route.ts`**

```ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { orderRowFromSession, type SessionLike } from '@/lib/shop/orders'
import { sendEmail, NOTIFY_EMAIL } from '@/lib/email/send'
import { formatGbp } from '@/lib/shop/cart'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    console.error('Stripe env vars are not set')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const signature = request.headers.get('stripe-signature')
  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature ?? '', webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as unknown as SessionLike

  let row
  try {
    row = orderRowFromSession(session)
  } catch (e) {
    console.error('webhook: bad session payload', e)
    return NextResponse.json({ error: 'Bad session payload' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('orders').insert(row)
  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ received: true }) // retry of an already-recorded order
    }
    console.error('webhook: order insert failed', error)
    return NextResponse.json({ error: 'Order insert failed' }, { status: 500 }) // Stripe will retry
  }

  const itemLines = row.items.map((i) => `- ${i.slug} × ${i.quantity}`).join('\n')
  const shipping = row.shipping_address ? `\nShipping:\n${JSON.stringify(row.shipping_address, null, 2)}` : ''
  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      subject: `New order ${formatGbp(row.total_pence)} — ${row.customer_email}`,
      text: `New order from ${row.customer_name ?? row.customer_email} (${row.customer_email})\n\n${itemLines}\n\nTotal: ${formatGbp(row.total_pence)}${shipping}\n\nStripe session: ${row.stripe_session_id}`,
      replyTo: row.customer_email,
    })
    const hasLesson = row.items.some((i) => i.slug.includes('session'))
    if (hasLesson) {
      await sendEmail({
        to: row.customer_email,
        subject: 'Your American Mahjong lesson — next steps',
        text: `Thank you for booking a lesson with American Mahjong | London!\n\nAndrew will email you shortly to arrange a time that suits you.\n\nQuestions in the meantime? Just reply to this email.\n\nLearn it once, love it forever!`,
        replyTo: NOTIFY_EMAIL,
      })
    }
  } catch (e) {
    // Order is safely recorded; a failed notification email must not make Stripe retry.
    console.error('webhook: notification email failed', e)
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 8: Write `src/app/(shop)/checkout/success/page.tsx` and its cart-clearing client child**

Create `src/components/shop/ClearCartOnMount.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useCart } from './CartProvider'

export function ClearCartOnMount() {
  const { dispatch } = useCart()
  useEffect(() => {
    dispatch({ type: 'clear' })
  }, [dispatch])
  return null
}
```

Create `src/app/(shop)/checkout/success/page.tsx`:

```tsx
import Link from 'next/link'
import { ClearCartOnMount } from '@/components/shop/ClearCartOnMount'

export const metadata = { title: 'Order Confirmed — American Mahjong | London' }

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24 flex flex-col items-center gap-6 text-center">
      <ClearCartOnMount />
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Thank you — order confirmed!
      </h1>
      <p className="text-xl leading-relaxed text-[var(--text-secondary)] max-w-xl">
        A receipt is on its way to your email. If your order includes a lesson, Andrew will
        email you shortly to arrange a time. Anything else, just{' '}
        <Link href="/get-in-touch" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-dark)]">get in touch</Link>.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/lobby" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Play Birdy While You Wait
        </Link>
        <Link href="/shop" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-subtle)] active:scale-[0.97] transition-all duration-150">
          Back to Shop
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Verify**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all green. Full Stripe-test-mode verification happens in Task 17.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/app/api/checkout src/app/api/stripe src/lib/shop/orders.ts src/lib/shop/orders.test.ts "src/app/(shop)/checkout" src/components/shop/ClearCartOnMount.tsx
git commit -m "feat(shop): stripe checkout, webhook order recording, confirmation page"
```

---

### Task 15: Admin orders page

**Files:**
- Create: `src/app/(admin)/admin/orders/page.tsx`
- Modify: `src/app/(admin)/admin/layout.tsx` (add "Orders" to the sidebar nav, following the existing `SidebarIcon`/link pattern in that file)

**Interfaces:**
- Consumes: `createServiceClient`, `formatGbp`, `OrderRow` shape from the `orders` table. The admin layout already gates on the admin role — follow whatever guard pattern `admin/users/page.tsx` uses.

- [ ] **Step 1: Write `src/app/(admin)/admin/orders/page.tsx`**

First read `src/app/(admin)/admin/users/page.tsx` and mirror its data-access + guard pattern exactly. The page body:

```tsx
import { createServiceClient } from '@/lib/supabase/server'
import { formatGbp } from '@/lib/shop/cart'

export const metadata = { title: 'Orders — Admin' }
export const dynamic = 'force-dynamic'

type OrderListItem = {
  id: string
  created_at: string
  customer_email: string
  customer_name: string | null
  items: { slug: string; quantity: number }[]
  total_pence: number
  status: 'new' | 'fulfilled'
  shipping_address: Record<string, string> | null
}

export default async function AdminOrdersPage() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(`Failed to load orders: ${error.message}`)
  const orders = (data ?? []) as OrderListItem[]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Orders
      </h1>
      {orders.length === 0 ? (
        <p className="text-lg text-[var(--text-secondary)]">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--border)]">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Ship to</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3">{o.customer_name ?? '—'}<br /><span className="text-[var(--text-muted)]">{o.customer_email}</span></td>
                  <td className="px-4 py-3">{o.items.map((i) => `${i.slug} × ${i.quantity}`).join(', ')}</td>
                  <td className="px-4 py-3 font-semibold">{formatGbp(o.total_pence)}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {o.shipping_address ? Object.values(o.shipping_address).filter(Boolean).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-sm text-sm font-semibold ${
                      o.status === 'new'
                        ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                        : 'bg-[var(--success-light)] text-[var(--success)]'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

If `admin/users/page.tsx` performs an explicit role check before rendering, replicate that exact check at the top of this page.

- [ ] **Step 2: Add "Orders" to the admin sidebar**

In `src/app/(admin)/admin/layout.tsx`, add an `orders` case to `SidebarIcon` (a simple package/box icon) and an "Orders" link to `/admin/orders`, matching the existing nav-link markup:

```tsx
case 'orders':
  return (
    <svg {...iconProps} viewBox="0 0 24 24">
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  )
```

(Extend the `name` prop union with `'orders'`.)

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm run build`

```bash
git add "src/app/(admin)"
git commit -m "feat(admin): orders page for fulfillment"
```

---

### Task 16: CLAUDE.md and docs updates

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `CLAUDE.md`**

Make these exact edits:

1. **Project Overview** — replace product/brand lines:
   - `**Product:** American Mahjong | London — the online home of AML: lessons, shop, and free online play`
   - `**Brand:** American Mahjong | London (site brand); the online game is "Birdy" (peacock logo appears only in game surfaces)`
   - `**Visual style:** AML palette — navy, berry, blush pink, cream (sampled from americanmahjonglondon.com); Poppins typography`
2. **What Not To Do** — delete the line `**No payment/subscription** — platform is free`; add:
   - `**Playing is free** — the game has no paywall. The shop (lessons + equipment) uses Stripe hosted Checkout; prices are always looked up server-side from the products table.`
   - `**Stripe webhook is the only writer of orders** — via service client.`
3. **Environment Variables** — add to the block:

```bash
STRIPE_SECRET_KEY=              # server-only
STRIPE_WEBHOOK_SECRET=          # server-only
RESEND_API_KEY=                 # server-only
ORDER_NOTIFY_EMAIL=hello@americanmahjonglondon.com
```

4. **File Structure** — add `(shop)/` (shop, cart, checkout) under `src/app/`, `api/checkout/`, `api/stripe/webhook/`, `api/contact/`, `api/newsletter/`, `components/shop/`, `lib/shop/`, `lib/email/`, and `public/aml/`.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for AML brand and Stripe commerce"
```

---

### Task 17: Full verification pass

**Files:** none created — verification only.

- [ ] **Step 1: Automated checks**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass, including the untouched game-engine suite.

- [ ] **Step 2: Browse every nav destination**

Start `npm run dev`, then with Playwright (or by hand) visit and screenshot: `/`, `/lobby`, `/private-lessons`, `/about`, `/shop`, `/shop/nmjl-card-2026`, `/discover`, `/london-local`, `/get-in-touch`, `/cart`, `/how-to-play`. Check: AML branding on every page, no Birdy peacock outside game surfaces, no leftover "Birdy American Mahjong" site titles, nav + footer complete, text ≥18px.

- [ ] **Step 3: Cart + checkout flow (Stripe test mode)**

Requires `.env.local` with Supabase + `STRIPE_SECRET_KEY` (test key). Add the NMJL card (qty 2) and a lesson to the cart → Checkout → complete with card `4242 4242 4242 4242` → land on `/checkout/success` with an emptied cart. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` during the test and confirm: an `orders` row appears, admin `/admin/orders` shows it, notification email sends (or logs a clear error if `RESEND_API_KEY` is absent). If env vars are unavailable in this environment, report exactly which steps were verified and which remain for the user.

- [ ] **Step 4: Report**

Summarize what passed, what needs user-supplied env (Stripe keys, Resend key, Supabase project), and the deploy-time reminders: create the Stripe webhook endpoint in the dashboard, apply `002_shop.sql`, and point the `americanmahjonglondon.com` domain at the deployment when ready.
