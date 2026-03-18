# American Mahjong Platform — Design Document

**Date:** 2026-03-18
**Product:** Birdy American Mahjong — online multiplayer platform
**Client brand:** Birdy American Mahjong (peacock logo)
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth, DB, Realtime, Edge Functions)

---

## 1. Vision

A free-to-play online American Mahjong platform targeting primarily elderly women. Design prioritizes accessibility (large text, clear buttons, warm colors) and brand visibility (Birdy tile designs). Inspired visually by Werner Bronkhorst's CRACK Prints — warm earth tones, painterly textures, joyful and human.

## 2. V1 Scope

**In scope:** Auth (login/signup) + game engine (create/join rooms, matchmaking, play full games)
**Out of scope for V1:** Ads, landing/marketing pages, payment, groups/community features

## 3. Architecture

Monolith — single Next.js app on Vercel.

- **Supabase Auth** for login (email + Google OAuth)
- **Supabase Realtime** (broadcast channels) for lobby presence + in-game state sync
- **Supabase Edge Functions** for authoritative game actions (draw, discard, claim, charleston)
- **Supabase Postgres** for persistent game state, user profiles, NMJL card data
- Game engine logic in `src/lib/game-engine/` — pure TypeScript, shared between client (optimistic UI) and Edge Functions (validation)

## 4. Matchmaking

- **Private rooms:** Host creates game → gets 6-char code → shares with friends
- **Public matchmaking:** Players queue → auto-matched when 4 found
- **Bot backfill:** After 30s in queue, empty seats filled with AI bots

## 5. Game Flow

```
WAITING → CHARLESTON → PLAYING → FINISHED
                                    ↓
                                ABANDONED
```

### WAITING
Host creates room. Players join via code or matchmaking fills seats.

### CHARLESTON
Three mandatory passes (Right → Across → Left). Optional second Charleston if all agree. Optional courtesy pass across. Edge Function validates no pass-backs.

### PLAYING
Turn loop:
1. Current player draws from wall (auto) or claims a discard
2. Player selects tile to discard
3. Edge Function validates, broadcasts to all players
4. Claim window (~5s) — any player can call Pung/Kong/Mahjong
5. Priority: Mahjong > next-in-turn > others
6. Claimed → claimant exposes group, discards, becomes current player
7. No claim → next player draws

### FINISHED
Player declares Mahjong → Edge Function matches hand against NMJL card → calculates score.

Scoring:
- Self-draw: all 3 opponents pay hand value
- Discard win: only discarder pays, at double value

### Bot Logic (V1)
Simple strategy: evaluate hand against NMJL patterns, pick closest match, discard tiles furthest from goal.

## 6. Key Validations (Server-Side)

- Jokers only in groups of 3+ (never pairs)
- Joker swap only if player holds the matching tile
- Dead hand detection on incorrect claims/exposures
- Concealed hand enforcement for "C" hands
- Turn timer (configurable, default 30s)
- Cannot discard tile used for joker swap

## 7. NMJL Card System

Admin-editable via admin panel. Stored in `nmjl_hands` table with:
- Human-readable pattern (e.g., "FF 222 000 222 555")
- Machine-parseable JSONB for automated hand matching
- Category, suits rule, concealed flag, point value
- Yearly — supports card updates without code changes

## 8. Database Schema

See `supabase/migrations/` for full SQL.

Core tables: `profiles`, `games`, `game_players`, `nmjl_hands`, `matchmaking_queue`

Key RLS rules:
- Players can only read their own hand
- Wall is never exposed to clients
- Public read on NMJL hands
- Admin full CRUD on all tables

## 9. Design System

### Palette
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FAF7F2` | Warm off-white background |
| `--bg-card` | `#F3EDE4` | Card/panel surfaces |
| `--text-primary` | `#2D2A26` | Dark warm brown |
| `--text-muted` | `#8A8279` | Secondary text |
| `--brand` | `#1B5E3B` | Deep peacock green |
| `--brand-light` | `#2D8F5E` | Hover green |
| `--accent-warm` | `#C46A3C` | Terracotta — CTAs |
| `--accent-gold` | `#C49A3C` | Ochre — highlights |
| `--tile-bg` | `#FFFFF5` | Ivory tile face |
| `--tile-border` | `#D4C9B8` | Warm grey tile edge |
| `--error` | `#C44B3C` | Soft red |
| `--success` | `#3B8A5E` | Muted green |

### Typography
- Base: 18px minimum
- Headings: elegant, warm (not techy)
- Buttons: 16px+, generous padding (py-4 px-8)

### Accessibility (elderly audience)
- Minimum touch target: 48px
- High contrast: 4.5:1 minimum
- No hover-only interactions
- Large tiles, clear suit/number labels
- Confirmation before irreversible actions

## 10. Game Board Layout

```
┌─────────────────────────────────────────┐
│  Brand bar (Birdy logo)     [Settings]  │
├─────────────────────────────────────────┤
│         Opponent 3 (top)                │
│  ┌───┐ ┌───┐ ┌───┐ ...  (face down)    │
│                                         │
│ Opp2 │      Discard Pile       │ Opp4   │
│(left)│    ┌───┬───┬───┐       │(right)  │
│      │    │   │   │   │       │         │
│      │    └───┴───┴───┘       │         │
│                                         │
│  YOUR HAND (large, interactive)         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ... ┌───┐    │
│  │ 3 │ │ 7 │ │ 2 │ │ J │ ... │ N │    │
│  │Bam│ │Dot│ │Crk│ │ ★ │ ... │ W │    │
│  └───┘ └───┘ └───┘ └───┘ ... └───┘    │
├─────────────────────────────────────────┤
│  [Discard] [Claim] [View Card]  Status  │
└─────────────────────────────────────────┘
```

## 11. File Structure

```
src/
  app/
    (public)/              # Landing, how-to-play, about
    (auth)/                # Login, signup
    (game)/                # Lobby, play, stats
    (admin)/admin/         # Admin panel + NMJL card editor
    api/game/              # Game action endpoints
    api/matchmaking/       # Queue + bot backfill
  components/
    ui/                    # Button, Input, Modal
    layout/                # Header, Footer
    game/                  # Board, Hand, DiscardPile, Wall, Charleston
    tiles/                 # SVG tile components
  lib/
    supabase/              # Client helpers
    game-engine/           # State machine, validation, scoring
    tiles/                 # Tile definitions, constants
    matchmaking/           # Queue logic
  styles/
    globals.css
    tokens.css
  supabase/
    migrations/            # SQL schema files
```

## 12. Reference

- **Competitor:** ilovemahj.com — $6/mo, bots + live play, video calling, group management
- **Art inspiration:** Werner Bronkhorst CRACK Prints — warm earth tones, sculptural textures, terracotta/ochre/sandy neutrals
- **Rules doc:** `docs/RULES.md` (from american_mahjong_rules_1.pdf)
- **NMJL 2025 Card:** `docs/NMJL_2025_CARD.md` (from Mahjong Sequence Final.docx)
