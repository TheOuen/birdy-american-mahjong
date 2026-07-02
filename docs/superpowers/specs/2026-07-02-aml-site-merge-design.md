# American Mahjong | London — Site Merge Design

**Date:** 2026-07-02
**Status:** Approved by user
**Goal:** Fold the client's website (americanmahjonglondon.com) into this platform. The merged site carries the American Mahjong | London (AML) brand and content, with the existing Birdy game engine as its "Play Online" feature, plus a full cart + Stripe shop replacing their Squarespace store.

---

## Decisions (confirmed with user)

| Question | Decision |
|----------|----------|
| Branding | AML is the site brand everywhere. "Birdy" survives only as the game's name ("Play Birdy Online"). Peacock logo appears only inside the game experience. |
| Commerce | Build our own checkout — copy and improve the Squarespace store, wired to Stripe. This **overrides** the previous "no payments in V1" rule; CLAUDE.md must be updated. |
| Checkout style | Full cart (add multiple items) + Stripe hosted Checkout. |
| Assets | Scrape all images from the live Squarespace CDN into `/public/aml/`. Recreate the text-based AML logo in code. |
| Navigation | Home · Play Online · Private Lessons · About · Shop · Discover · London Local · Get in Touch · Cart. (NMJL Card + Scorecard pages merge into Shop.) |
| Architecture | Reskin + extend in place: one codebase, retheme tokens and chrome, add content routes and a shop section. Game engine untouched. |

---

## 1. Brand & Design System

- Site title/brand: **American Mahjong | London**. Text-based logo recreated in code, preserving their typographic quirks (mixed-case headings like "hOW iT WORKS", zeros-for-Os like "Mahj0ng", tagline "Learn it once, love it forever").
- During implementation, screenshot the live site with Playwright to sample exact colors and typography, then retheme `src/styles/tokens.css` to match. Their aesthetic (clean, warm, minimalist, mahjong-tile imagery) is close to the current warm-parchment palette — expect adjustment, not wholesale replacement.
- Birdy peacock logo (`public/logo.png`) moves to game-only surfaces (lobby, board, game header).
- Accessibility rules unchanged: 18px minimum base font, 48px touch targets, 4.5:1 contrast, no hover-only interactions.

## 2. Information Architecture

Header nav: **Home · Play Online · Private Lessons · About · Shop · Discover · London Local · Get in Touch · [Cart icon]**

### Routes

```
src/app/
  (public)/
    page.tsx                  # Home — AML homepage rebuilt (NEW)
    private-lessons/          # NEW
    about/                    # REBUILT with AML content + scraped photos
    discover/                 # NEW — press & article links
    london-local/             # NEW — club directory
    get-in-touch/             # NEW — contact form + details
    how-to-play/              # KEPT — linked from Play Online area
  (shop)/
    shop/                     # NEW — product grid
    shop/[slug]/              # NEW — product detail pages
    cart/                     # NEW — cart review
    checkout/success/         # NEW — post-Stripe confirmation
  (game)/                     # UNCHANGED — lobby, play/[gameId], stats
  (auth)/                     # UNCHANGED
  (admin)/admin/orders/       # NEW — order list for fulfillment
  api/
    checkout/                 # NEW — create Stripe Checkout Session
    stripe/webhook/           # NEW — record orders, notify Andrew
    contact/                  # NEW — Resend email from contact form
```

### Page content (sourced from live site)

- **Home:** hero "Learn American Mahjong — with Andrew"; prominent free **Play Online** callout (the big enhancement vs. their current site); How It Works; three lesson offerings with pricing linking to Private Lessons; About Mahjong section (history, 152 tiles, NMJL); Andrew bio teaser; products strip; newsletter signup; contact footer.
- **Private Lessons:** Beginner Individual Session (2.5 hours), Beginner Group Session (£150 per person, 2–4 players), Private Session 1 Hour (£125). Each purchasable via cart. Exact prices verified against the live store during implementation.
- **About:** Andrew Robson's story (South Africa, PPE; Law in London; learned mahjong travelling the US; founded AML to bring the game to London). Uses scraped photos of Andrew teaching.
- **Shop:** 2026 Official NMJL Card, large print (£15); American Mahjong Scorecard Notepad, A5, 50 pages (£10); free downloadable scorecards (landscape + portrait) hosted as PDFs in `/public/aml/downloads/`.
- **Discover:** "Everything Mahj0ng" article links (Martha Stewart brain-health piece, Dear Asia how-to guide, Smithsonian) and "Mahj in the News" press list (Economist, Boston Globe, FT, Washington Post, Vogue).
- **London Local:** Sik Wu (Kentish Town), Dear Asia (Aldgate), 4 Winds (Dalston/Camden) with outbound links.
- **Get in Touch:** contact form (name, email, message → Resend email to hello@americanmahjonglondon.com), plus phone and email displayed. Newsletter signup stores emails in a Supabase `newsletter_subscribers` table.
- **Play Online:** existing game routes, wrapped in AML site chrome; game surfaces branded "Birdy".

## 3. Commerce

- **Catalog:** `products` table in Supabase (name, slug, description, price_gbp, stripe_price_id, type: `physical | lesson`, image, active). Seeded via migration with the five products.
- **Cart:** client-side React context persisted to localStorage. Header cart icon with count. Cart page with quantity edit/remove. No DB writes for carts.
- **Checkout:** `POST /api/checkout` builds a Stripe Checkout Session from cart line items (server-side price lookup — never trust client prices). Physical items enable Stripe shipping-address collection. Redirect to Stripe hosted checkout; success returns to `/checkout/success`.
- **Orders:** Stripe webhook (`checkout.session.completed`) writes an `orders` row (items, amounts, customer email, shipping address, stripe session id, status) and emails Andrew via Resend. Lesson purchases trigger a customer confirmation email noting Andrew will contact them to schedule. RLS: customers read own orders (by auth uid when logged in); admin reads all.
- **Admin:** `/admin/orders` lists orders with status (new → fulfilled), reusing existing admin auth guard.
- **Env:** add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`.

## 4. Assets

- Scrape all Squarespace CDN images (Andrew photos, product shots, tile imagery) into `/public/aml/`, referenced via `next/image`. No hotlinking — their CDN disappears when Squarespace is retired.
- Recreate free scorecard PDFs (download from live site into `/public/aml/downloads/`).

## 5. Out of Scope / Unchanged

- Game engine, NMJL matching, Charleston, matchmaking, Realtime sync, Edge Function authority model — untouched.
- No inventory management, discount codes, or subscriptions.
- No migration of their Squarespace customer/order history.
- Their domain cut-over (DNS pointing americanmahjonglondon.com at this app) is a deploy-time task, noted but not part of this build.

## 6. Documentation Updates

- CLAUDE.md: replace "No payment/subscription" with the Stripe commerce rules; update brand section (AML site brand, Birdy = game name); add new env vars; update file structure.

## 7. Error Handling

- Checkout API validates cart against `products` (active, known slugs); returns 400 on mismatch.
- Webhook verifies Stripe signature; unhandled events acknowledged with 200; failures logged and retried by Stripe.
- Contact form: server-side validation + basic rate limit; graceful error state in UI.
- Scraped-asset build step fails loudly if an expected image is missing.

## 8. Testing

- Existing game-engine tests must keep passing (no engine changes).
- Unit tests: cart reducer (add/remove/quantity/persist), checkout session builder (server-side pricing), webhook handler (order creation, signature rejection).
- Manual/Playwright verification: all nine nav destinations render with AML branding; full purchase flow against Stripe test mode; contact form delivers email.
