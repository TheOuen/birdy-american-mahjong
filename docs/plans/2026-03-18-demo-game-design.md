# Demo Game — Design Document

**Date:** 2026-03-18
**Goal:** Playable solo game against 3 bots, all client-side

## Approach
Option C: Solo first (local game engine), then layer multiplayer via Supabase later.
Same engine code runs both modes — pure TypeScript, no framework deps.

## Scope
- Shuffle 152 tiles, deal 14 to East (player), 13 to others
- Draw/discard turn loop, counter-clockwise
- Bots auto-discard (random for V1)
- Game ends on wall exhaustion (wall game)
- Skip Charleston, claiming, Mahjong declaration in V1 demo

## Components
- `TileRenderer` — single tile, color-coded by suit
- `PlayerHand` — bottom of screen, tappable tiles
- `DiscardPile` — center grid of discarded tiles
- `OpponentRow` — name, tile count, exposed groups
- `GameBoard` — orchestrates full game view
- `engine.ts` — shuffle, deal, draw, discard, bot AI

## Next steps after demo works
- Charleston phase
- Claim window (Pung/Kong/Mahjong)
- NMJL hand matching
- Scoring
- Supabase multiplayer via Realtime
