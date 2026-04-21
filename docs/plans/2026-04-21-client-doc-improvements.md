# Improvement Plan — Client Documents Audit

**Date:** 2026-04-21
**Sources:**
- `2026 NMJL Card Teaching Guide.docx` — the new 2026 NMJL card (replaces 2025)
- `2025 NMJL Card Teaching Guide.docx` — reference for what we already have
- `DRAFT GUIDE American Mahjong 4.docx` — client's definitive rules/teaching guide

This plan maps gaps between those docs and the current codebase, grouped by priority. Each item lists the touch-points so work can be parcelled out.

---

## P0 — 2026 Card Migration (blocks real users)

The whole engine is hard-coded against the 2025 card. The 2026 card is active for real-world play right now; shipping without it makes the product unusable against a physical card on the table.

### P0-1. Author `NMJL_2026_HANDS` dataset
- New file: `src/lib/nmjl/hands-2026.ts` — full 2026 card (≈50 hands across 2026, 2468, Any Like Nos., Quints, Consecutive Run, 13579, Winds-Dragons, 369, Singles & Pairs)
- Source rows: extract from `2026 NMJL Card Teaching Guide.docx` verbatim — preserve pattern string, suitsRule, X/C, points
- New patterns the 2025 set never had — parser will need the constructs in P0-2:
  - `Kong 2 or 6`, `Kong 2, 4, 6 or 8` — constrained fixed-number slots
  - `Any 1 Suit, East and West Only` / `North and South Only` — wind-pair constraints
  - `Matching Dragon` vs `Opposite Dragon` — suit↔dragon correspondence
  - `Like Odd/Even Nos.` — number-parity constraints
  - Quints/WD/369 now carry **points + X/C** (2025 had `—`); Singles & Pairs go up to **75 points** (`FF 2026 2026 2026 C 75`)

### P0-2. Card registry + year switch
- `src/lib/nmjl/index.ts` exports `getActiveCard(year: number)` → returns `NmjlHand[]`
- Today's consumers (`matcher.ts`, `claims.ts`, `NmjlCardViewer.tsx`) hard-import `NMJL_2025_HANDS`; replace with `getActiveCard(state.cardYear)`
- Add `cardYear: number` to `GameState` (default 2026)
- Admin UI (post-V1) and game-creation flow can override to 2025 for practice

### P0-3. Point-value corrections in engine
- 2025 has `—` for Quints/WD/369/S&P; current code fills in 35/30/— inconsistently. 2026 publishes explicit values (Quints 40/45, S&P 50/75).
- Scoring already multiplies handValue — no engine change, just correct values in the dataset.

---

## P1 — Matcher bugs that break multiple 2026 hands

The current `matcher.ts` produces false positives/negatives on constraints that were cosmetic in 2025 but load-bearing in 2026.

### P1-1. `0` means White Dragon (Soap), not a free-number suit slot
- `matcher.ts:85-91` treats `0` as a suit number with variable slot — wrong.
- Per DRAFT GUIDE §2: the White Dragon is played as zero. `000` in `222 000 2222 6666` must match **3 White Dragon tiles**, not "any 3 suit tiles of some number".
- Fix: when token is `0`/`00`/`000`/`0000`, emit a `dragon` group with `dragonColor: 'white'`.
- Ripples: `2025-2`, `2025-4`, 2026 hand 1 (`222 000 2222 6666`), 2026 hand 7 (`22 00 222 666 NEWS`), 2026 hand 31 (`NN EEE 2026 WWW SS`) all silently over-match today.

### P1-2. "Matching Dragon" / "Opposite Dragon"
- Today: `D` groups resolve to `dragonColor: 'any'` — accepts any dragon.
- Needed: constrain dragon colour by the active suit assignment.
  - Matching: Bam↔Green, Crak↔Red, Dot↔White
  - Opposite: any dragon *not* matching
- Signal comes from the `suitsRule` text (`w Matching Dragons`, `w Opp. Dragon`, `w Opp. Dragons`). Cleanest fix: parse the rule into a structured `suitsRule: { kind, matchingDragon?, oppositeDragon?, consecutive?, like?, windsOnly? }` object and have the matcher honour it.
- Hands affected: `369-3`, `369-6`, `13579-6`, 2026 hands `2026-2`, `2026-5`, `2026-13`, `2026-16`, `wd-*`, many more.

### P1-3. Wind-pair constraints ("East and West Only", "North and South Only")
- Some 2026 hands pin winds to a specific pair: `EE 22 444 666 88 WW (Any 1 Suit, East and West Only)` and `NN 1111 33 5555 SS (Any 1 Suit, North and South Only)`.
- Parser currently records specific directions but doesn't reject the "-or-" mirror (`NN...SS` should only allow N+S, not E+W).
- Fix: structured suitsRule carries `windsOnly: ['north','south']`; matcher rejects other wind tokens.

### P1-4. Structural "Any N Suits" enforcement
- Today's matcher tries suit assignments per group but doesn't enforce that **colour-group** tiles end up in the same suit, nor that "Any 2 Suits" uses exactly 2 distinct suits.
- The NMJL card expresses this via **colour** (blue/red/green) — all blue tokens share one suit, all red another, all green another (DRAFT GUIDE §"Understanding Colours").
- Data change: add `colourGroups` to each hand: array of `{ colour: 'blue'|'red'|'green', tokenIndexes: number[] }`. Matcher then requires a single suit assignment per colour, and that the distinct-suit count equals the `suitsRule` count.
- Without this, "3 Suits" hands match when all three tile groups happen to be Bam, etc.

### P1-5. Consecutive / like-number constraints
- "Any 3 Consec. Nos.", "Any Like Even No.", "Any Like Odd No." currently left to chance because slots get assigned independently.
- Fix (same structured `suitsRule`): when `consecutive: true`, slots must form a run; when `parity: 'even'|'odd'`, slots must match parity; when `like: true`, slots must share a value.

### P1-6. Jokers in specific-wind singles/pairs still illegal
- Covered today by `if (g.count < 3)` rule. Add a belt-and-braces check when parsing S&P hands to ensure jokers are never considered for single-tile `NEWS` slots or pairs.

---

## P2 — Gameplay rules from the DRAFT GUIDE that the engine doesn't enforce

### P2-1. Jokerless Mahjong bonus (DRAFT GUIDE Joker Rule 7)
- Winning without using any joker pays **double** — except on Singles & Pairs hands.
- Track `jokersUsed: boolean` through the match — the matcher already walks joker deficits; expose the final count.
- `scoring.ts:calculateScore` takes `jokerless: boolean` and the winning `NmjlHand`; applies `* 2` multiplier unless `category === 'singles-and-pairs'`.

### P2-2. Mahjong-in-Error penalties
- False Mahjong call, hand not shown → no-op
- Hand shown → caller dead, everyone else plays on
- Another player reacted by showing their hand → caller pays **double** the hand's value to the intact player only; others pay 0
- Requires a new `declare_mahjong_error` flow and a short "hand reveal" window in the UI; engine hook in `engine.ts` and scoring branch in `scoring.ts`.

### P2-3. Dead-hand continuation
- Dead players currently don't participate — confirmed in `claims.ts:33` (`if (player.isDead) return []`).
- But they must **still pay** when someone else wins. Verify `applyScores` iterates all players including dead; add test.
- Jokers already in a dead player's exposures remain swappable (Joker Rule 6) — `executeJokerSwap` currently allows any exposed group but should be audited for the dead-hand case.

### P2-4. "Change your exposure before discarding" (Claim Rule 8)
- Once a player claims a discard, they can rearrange the exposed group (e.g. swap a real tile for a joker) until they discard. Engine today locks the exposure at claim time.
- Add a `rearrange_exposure` action valid only while the claimer holds the turn and before discard.

### P2-5. Joker swapping — verify Rule 5 symmetry
- Current `executeJokerSwap` allows self-swap (code explicitly handles `playerId === targetPlayerId`). Confirm it enforces "on your turn only" (it does) and that the swapped-in tile can't be discarded this turn (it does via `noDiscardTileId`). No fix needed — just tests.

### P2-6. Claim priority tie-breakers (Claim Rules 4-7)
- Rule 4 (Mahjong beats any exposure claim) — not enforced in `claims.ts`; the 5s claim window resolves first-in-wins.
- Rule 5 (tie for exposure → closest to left of discarder wins) — needs turn-order distance calculation.
- Rule 6/7 (physical exposure locks in) — for digital, translate to "first claim registered wins, but Mahjong always pre-empts unclaimed exposures".
- Refactor: claim window collects *all* claims, then resolves at window end with priority `mahjong > closest-next-seat exposure > other exposure`.

---

## P3 — Charleston completeness

### P3-1. Blind pass
- Spec: on the **first Left** and **last Right** only, a player may forward 1/2/3 tiles of what they just received without looking, filling any remainder from their own hand.
- Engine change: `executeCharlestonPass` accepts `{ fromHand: TileId[], blindForward: TileId[] }`; validates that blind tiles were in the previous incoming bundle and that the step is first-left or last-right.
- UI: toggle "blind pass" button on those two steps; dim face-down look of forwarded tiles.

### P3-2. Courtesy pass
- Spec: after the (first or second) Charleston, the player across can exchange 0-3 tiles — both must agree, no jokers.
- `CharlestonStep` already includes `'courtesy'` and `GameAction` has `'courtesy_pass'` — but `charleston.ts` never transitions to this step. Implement: after first-left-stop or after full second, enter a courtesy-vote phase.

### P3-3. Stop-Charleston vote
- Currently the engine always prompts for the second Charleston via `awaitingSecondVote`. Add an earlier "Stop?" vote immediately after first-left (DRAFT GUIDE "only after the first left pass").
- All four players must agree to continue; any single "stop" ends the Charleston (courtesy pass still available).

---

## P4 — Teaching content & card UX (elderly-first audience)

### P4-1. Rewrite `how-to-play` from the DRAFT GUIDE
- Current page is a patchwork — the DRAFT GUIDE has authoritative, warm client-voiced copy. Adopt it, including:
  - "Birdie Bam" origin story for 1 Bam (on brand — peacock logo)
  - "Soap" as nickname for White Dragon + zero usage
  - R.O.L.L.O.R. acronym for Charleston order
  - Colour-coding explanation of the NMJL card (blue/red/green aren't suits)
- Keep the visual examples already built with `TileRenderer`.

### P4-2. Colour-coded NMJL card viewer
- `NmjlCardViewer.tsx` today shows pattern as plain text. Once P1-4 introduces `colourGroups`, render tokens in the NMJL card colours (blue/red/green) so players can see which groups must share a suit. This is the *single most confusing* part of the card for new players per the DRAFT GUIDE.

### P4-3. Spoken-aloud discards (accessibility)
- DRAFT GUIDE rule: every discard must be named aloud. For an elderly audience this is a genuine feature — `speechSynthesis.speak("5 Bam")` on each discard, toggleable in settings. No engine change needed.

### P4-4. In-game "hand helper"
- Surface the `findMatchingHands` output as suggestions ("you're 2 tiles from 13579-8"). Already feasible with current matcher; low cost, high comfort for new players.

---

## P5 — Variants (future / optional)

Out of V1 scope but called out in the DRAFT GUIDE — park as backlog cards so they're not lost:

- **Messy Mahjong** — skip wall-build/deal, draw 13/14 at random from shuffled pile
- **2- or 3-player** — tile draw from the centre instead of round-robin
- **Blanks variant** — 6 blanks + 10 jokers; blanks swap for dead tiles only, never in exposures, can't mahjong on a blank. Needs new tile type `{ kind: 'blank' }` and an "exchange blank" action.

---

## Suggested sequencing

1. **P0-1 + P0-2** (card data + registry) — ~1 day, unblocks everything visible.
2. **P1-1 + P1-2** (Soap/dragon constraints) — ~1 day, fixes the biggest false-positive class.
3. **P1-4 + P1-5** (structured suitsRule, colour groups, consecutive/parity) — ~2-3 days, the real refactor.
4. **P2-1** (jokerless bonus) — ~0.5 day once matcher reports joker usage.
5. **P3-1 + P3-2 + P3-3** (Charleston: blind / courtesy / stop vote) — ~1-2 days.
6. **P2-2 / P2-4 / P2-6** (mahjong-in-error, rearrange exposure, claim priority) — ~2 days; do together because they touch the same claim-window code.
7. **P4-1 + P4-2** (teaching page rewrite + colour-coded card) — ~1-2 days of content + light UI.
8. **P5** — defer.

## Files likely to change

- `src/lib/nmjl/hands.ts` → split into `hands-2025.ts`, `hands-2026.ts`; `hands.ts` becomes a registry
- `src/lib/nmjl/types.ts` → add structured `suitsRule`, `colourGroups`
- `src/lib/nmjl/matcher.ts` → honour structured constraints; treat `0` as White Dragon
- `src/lib/game-engine/types.ts` → `cardYear`, new claim-priority state
- `src/lib/game-engine/scoring.ts` → jokerless bonus, error penalties
- `src/lib/game-engine/charleston.ts` → blind pass, courtesy, stop vote
- `src/lib/game-engine/claims.ts` → claim-window resolver with priority
- `src/lib/game-engine/engine.ts` → `declare_mahjong_error`, rearrange-exposure action
- `src/components/game/NmjlCardViewer.tsx` → colour rendering
- `src/components/game/CharlestonPhase.tsx` → blind/courtesy/stop UI
- `src/app/(public)/how-to-play/page.tsx` → rewrite from DRAFT GUIDE
- `docs/NMJL_2026_CARD.md` → new reference doc mirroring 2025 one
- `docs/RULES.md` → align with DRAFT GUIDE (misnamed tile, mahjong-in-error, joker-stealing details, courtesy pass, blind pass)
