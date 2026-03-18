# Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully playable single-player American Mahjong demo with sorted hands, claiming, exposed groups, NMJL card viewer, How to Play page, and proper game flow.

**Architecture:** All game logic in `src/lib/game-engine/` (pure TS). UI in `src/components/game/` and `src/components/tiles/`. Public pages in `src/app/(public)/`. Demo runs 100% client-side — same engine will power multiplayer later via Supabase Edge Functions.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, design tokens from `src/styles/tokens.css`

---

## Task 1: Sort hand by suit and number

**Files:**
- Create: `src/lib/tiles/sorting.ts`
- Modify: `src/components/game/PlayerHand.tsx`

**What:** Add a `sortHand()` utility that orders tiles: Flowers → Bam → Crak → Dot → Winds → Dragons → Jokers, each sub-sorted by number/direction/color. Apply it in PlayerHand before rendering.

**Implementation:**

`src/lib/tiles/sorting.ts`:
```ts
import type { Tile } from './constants'

const KIND_ORDER = ['flower', 'suit', 'wind', 'dragon', 'joker']
const SUIT_ORDER = ['bam', 'crak', 'dot']
const WIND_ORDER = ['east', 'south', 'west', 'north']
const DRAGON_ORDER = ['red', 'green', 'white']

function tileRank(tile: Tile): number {
  const t = tile.type
  const kindBase = KIND_ORDER.indexOf(t.kind) * 1000

  switch (t.kind) {
    case 'flower': return kindBase + t.number
    case 'suit': return kindBase + SUIT_ORDER.indexOf(t.suit) * 100 + t.number
    case 'wind': return kindBase + WIND_ORDER.indexOf(t.direction)
    case 'dragon': return kindBase + DRAGON_ORDER.indexOf(t.color)
    case 'joker': return kindBase
  }
}

export function sortHand(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => tileRank(a) - tileRank(b))
}
```

In `PlayerHand.tsx`, import `sortHand` and wrap: `const sorted = sortHand(tiles)` then render `sorted` instead of `tiles`.

**Commit:** `feat: sort player hand by suit and number`

---

## Task 2: Exposed groups display component

**Files:**
- Create: `src/components/game/ExposedGroups.tsx`
- Modify: `src/components/game/OpponentRow.tsx`

**What:** Render exposed tile groups (Pung/Kong/Quint) visually. Show on opponent rows and will be used for player's exposed groups too.

**Implementation:**

`src/components/game/ExposedGroups.tsx`:
```tsx
'use client'
import type { ExposedGroup } from '@/lib/game-engine/types'
import { TileRenderer } from '@/components/tiles/TileRenderer'

type ExposedGroupsProps = { groups: ExposedGroup[] }

export function ExposedGroups({ groups }: ExposedGroupsProps) {
  if (groups.length === 0) return null
  return (
    <div className="flex gap-3">
      {groups.map((group, i) => (
        <div key={i} className="flex gap-0.5 px-2 py-1 rounded-sm bg-[var(--bg)] border border-[var(--border)]">
          {group.tiles.map((tile) => (
            <TileRenderer key={tile.id} tile={tile} size="sm" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

Add `<ExposedGroups groups={player.exposed} />` to `OpponentRow.tsx`.

**Commit:** `feat: add exposed groups display component`

---

## Task 3: Claim window engine logic

**Files:**
- Modify: `src/lib/game-engine/types.ts` — add `ClaimWindow` type
- Modify: `src/lib/game-engine/engine.ts` — add `claimDiscard()`, `getValidClaims()`
- Create: `src/lib/game-engine/claims.ts` — claim validation logic

**What:** After a discard, open a claim window. Any player can claim for Pung (3 matching), Kong (4 matching), or Mahjong. Priority: Mahjong > any, then next-in-turn > others. Jokers count toward groups of 3+.

**Implementation:**

Add to `types.ts`:
```ts
export type ClaimWindow = {
  discardEntry: DiscardEntry
  discardIndex: number
  claims: Map<string, ClaimType> // playerId → claim type
  resolved: boolean
}
```

`src/lib/game-engine/claims.ts`:
```ts
import type { Tile, TileType } from '../tiles/constants'
import { tilesMatch } from '../tiles/constants'
import type { PlayerState, ClaimType } from './types'

// Count how many tiles in hand match a given type (including jokers for groups of 3+)
export function countMatching(hand: Tile[], target: TileType): { exact: number; jokers: number } {
  let exact = 0
  let jokers = 0
  for (const t of hand) {
    if (t.type.kind === 'joker') jokers++
    else if (tilesMatch(t.type, target)) exact++
  }
  return { exact, jokers }
}

// What claims can a player make on a discarded tile?
export function getValidClaims(player: PlayerState, discardedTile: Tile): ClaimType[] {
  if (player.isDead) return []
  const { exact, jokers } = countMatching(player.hand, discardedTile.type)
  // The discard itself counts as +1 to the group
  const total = exact + 1 // +1 for the discarded tile
  const claims: ClaimType[] = []

  if (exact >= 2 || (exact >= 1 && jokers >= 1) || jokers >= 2) claims.push('pung') // need 2 from hand + discard = 3
  if (exact >= 3 || (exact + jokers >= 3 && exact >= 1)) claims.push('kong') // need 3 from hand + discard = 4
  if (exact + jokers >= 4 && exact >= 1) claims.push('quint')
  if (exact + jokers >= 5 && exact >= 1) claims.push('sextet')
  // mahjong is checked separately against NMJL patterns (future task)

  return claims
}

// Build the exposed group from a claim
export function buildClaimGroup(
  hand: Tile[],
  discardedTile: Tile,
  claimType: ClaimType,
  selectedTileIds: string[]
): { group: Tile[]; remainingHand: Tile[] } | null {
  const sizeMap: Record<string, number> = { pung: 3, kong: 4, quint: 5, sextet: 6, mahjong: 14 }
  const targetSize = sizeMap[claimType]
  if (!targetSize) return null

  const fromHand = hand.filter((t) => selectedTileIds.includes(t.id))
  if (fromHand.length + 1 !== targetSize) return null // +1 for the discard

  const group = [discardedTile, ...fromHand]
  const remainingHand = hand.filter((t) => !selectedTileIds.includes(t.id))
  return { group, remainingHand }
}
```

Add `claimDiscard()` to `engine.ts` that:
1. Removes tiles from claimer's hand
2. Creates ExposedGroup
3. Marks discard as claimed
4. Sets claimer as currentTurn
5. Claimer must then discard (hand has extra tiles minus the exposed group)

**Commit:** `feat: add claim validation and execution logic`

---

## Task 4: Claim UI in GameBoard

**Files:**
- Create: `src/components/game/ClaimDialog.tsx`
- Modify: `src/components/game/GameBoard.tsx`

**What:** After any player discards, show a claim dialog if the player has valid claims. Player can choose Pung/Kong/Pass. If pass, bots check for claims too.

**Implementation:**

`ClaimDialog.tsx`: A bottom sheet/modal showing the discarded tile and buttons for each valid claim type plus "Pass".

In `GameBoard.tsx`:
- After player discards → check if any bot can claim → if not, advance normally
- After bot discards → check if player can claim → show ClaimDialog
- After bot discards → if player passes, check if other bots can claim
- Add `claimPhase` state: `null | { discardEntry, validClaims }`

**Commit:** `feat: add claim dialog and claim flow to game board`

---

## Task 5: Bot claiming logic

**Files:**
- Modify: `src/lib/game-engine/engine.ts`

**What:** After a discard, bots evaluate whether to claim. V1 simple: bots claim Pung/Kong if they can (always), never bluff. Skip Mahjong for now.

**Implementation:** Add `evaluateBotClaims()` that checks each bot's hand against the discarded tile and returns the highest-priority claim if any.

**Commit:** `feat: add bot claiming logic`

---

## Task 6: Joker swap mechanic

**Files:**
- Create: `src/lib/game-engine/jokerSwap.ts`
- Modify: `src/components/game/GameBoard.tsx`
- Modify: `src/components/game/ExposedGroups.tsx`

**What:** On your turn (after drawing), you can swap a joker from any exposed group on the table if you hold the tile it represents. The swapped joker goes into your hand. You cannot discard the tile you used to swap.

**Implementation:**

`jokerSwap.ts`:
```ts
export function canSwapJoker(hand: Tile[], group: ExposedGroup, tile: Tile): boolean {
  // The group must contain at least one joker
  // The tile must match the non-joker tiles in the group
  // (or if all jokers, any tile works for groups of 3+)
}

export function executeJokerSwap(state: DemoGameState, playerId: string, jokerTileId: string, replacementTileId: string, targetPlayerId: string, groupIndex: number): DemoGameState
```

In `ExposedGroups.tsx`, make joker tiles clickable during player's turn. Show which tiles in hand can replace the joker.

**Commit:** `feat: add joker swap mechanic`

---

## Task 7: NMJL 2025 card data + viewer component

**Files:**
- Create: `src/lib/nmjl/hands.ts` — all 2025 hands as structured data
- Create: `src/lib/nmjl/types.ts` — hand pattern types
- Create: `src/components/game/NmjlCardViewer.tsx` — in-game card reference
- Modify: `src/components/game/GameBoard.tsx` — add card viewer toggle

**What:** Parse the NMJL 2025 card into machine-readable format. Build an in-game viewer panel so the player can reference valid hands during play. Categorized by section (2025, 2468, Consecutive Run, etc.).

**Implementation:**

`src/lib/nmjl/types.ts`:
```ts
export type HandCategory = '2025' | '2468' | 'any-like-numbers' | 'quints' | 'consecutive-run' | '13579' | 'winds-dragons' | '369' | 'singles-and-pairs'

export type NmjlHand = {
  id: string
  category: HandCategory
  pattern: string          // human-readable e.g. "FF 222 000 222 555"
  suitsRule: string
  concealed: boolean
  points: number
}
```

`src/lib/nmjl/hands.ts`: Export `NMJL_2025_HANDS: NmjlHand[]` with every hand from the card doc.

`NmjlCardViewer.tsx`: Slide-out panel showing all hands grouped by category. Color-coded. Searchable.

**Commit:** `feat: add NMJL 2025 card data and in-game viewer`

---

## Task 8: How to Play page

**Files:**
- Create: `src/app/(public)/how-to-play/page.tsx`

**What:** Accessible, warm How to Play guide covering: tiles, setup, gameplay, Charleston, claiming, jokers, winning, scoring. Written for elderly audience — large text, clear sections, illustrations via tile components.

**Implementation:** Server component. Sections with anchor links. Use TileRenderer to show example tiles inline. Link back to lobby. Content derived from `docs/RULES.md` but simplified and friendly.

Sections:
1. What is American Mahjong?
2. The Tiles (with visual examples)
3. How a Round Works
4. The Charleston
5. Drawing & Discarding
6. Claiming Tiles
7. Jokers
8. Winning (NMJL Card)
9. Scoring

**Commit:** `feat: add How to Play page`

---

## Task 9: About page

**Files:**
- Create: `src/app/(public)/about/page.tsx`

**What:** Simple about page: what Birdy American Mahjong is, that it's free, the brand story. Logo + warm copy.

**Commit:** `feat: add About page`

---

## Task 10: Shared layout with navigation

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/layout.tsx`

**What:** Consistent header (logo, nav links: Play, How to Play, About) and footer across all pages. Navigation is accessible — large tap targets, clear labels.

**Commit:** `feat: add shared header and footer layout`

---

## Task 11: Charleston phase (engine)

**Files:**
- Create: `src/lib/game-engine/charleston.ts`
- Modify: `src/lib/game-engine/engine.ts`

**What:** Pre-game phase. Three mandatory passes (Right → Across → Left). Each player selects 3 tiles to pass. No passing back tiles received in the same direction. For demo: bots auto-select 3 random tiles.

**Implementation:**

`charleston.ts`:
```ts
export type CharlestonDirection = 'right' | 'across' | 'left'
export type CharlestonState = {
  step: 1 | 2 | 3
  direction: CharlestonDirection
  passes: Map<string, TileId[]> // playerId → selected tile IDs
  received: Map<string, Set<TileId>> // track what was received to prevent pass-backs
}

export function getCharlestonDirection(step: number): CharlestonDirection
export function validateCharlestonPass(tiles: TileId[], received: Set<TileId>): boolean
export function executeCharlestonPass(state: DemoGameState, charlestonState: CharlestonState): DemoGameState
```

**Commit:** `feat: add Charleston phase engine logic`

---

## Task 12: Charleston UI

**Files:**
- Create: `src/components/game/CharlestonPhase.tsx`
- Modify: `src/components/game/GameBoard.tsx`

**What:** Before gameplay starts, show Charleston UI. Player selects 3 tiles from hand to pass. Shows direction (Right/Across/Left). Clear instructions. Bots auto-pass. After 3 rounds of passing, transition to playing phase.

**Commit:** `feat: add Charleston phase UI`

---

## Task 13: Game over / scoring screen

**Files:**
- Create: `src/components/game/GameOverScreen.tsx`
- Modify: `src/components/game/GameBoard.tsx`

**What:** When game ends (wall game or Mahjong), show results screen: winner (if any), scoring breakdown, all hands revealed. "Play Again" button.

**Implementation:**
- Wall game: "No winner — wall game!" with all hands shown
- Mahjong win: winner's hand highlighted, scoring shown (self-draw vs discard payment)
- Points: from NMJL card hand value

**Commit:** `feat: add game over and scoring screen`

---

## Task 14: Dead hand detection

**Files:**
- Modify: `src/lib/game-engine/claims.ts`

**What:** If a player makes an invalid claim (exposes tiles that don't form a valid group), their hand is declared dead. Dead players can't draw, discard, or win — they just sit out the rest of the round.

**Implementation:** Add `validateExposure()` that checks exposed group is valid. If invalid, set `player.isDead = true`. Show visual indicator on opponent row and player hand.

**Commit:** `feat: add dead hand detection`

---

## Execution Order

1. Task 1 (sort hand) — instant quality of life
2. Task 10 (nav/layout) — consistent chrome
3. Task 8 (How to Play) — content page
4. Task 9 (About) — content page
5. Task 2 (exposed groups) — needed for claims
6. Task 3 (claim engine) — core mechanic
7. Task 4 (claim UI) — make claims playable
8. Task 5 (bot claiming) — bots use claims
9. Task 7 (NMJL card viewer) — reference during play
10. Task 6 (joker swap) — advanced mechanic
11. Task 11 (Charleston engine) — pre-game phase
12. Task 12 (Charleston UI) — make Charleston playable
13. Task 14 (dead hand) — edge case handling
14. Task 13 (game over screen) — polish ending

**Estimated commits:** 14
