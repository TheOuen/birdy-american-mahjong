// NMJL 2026 card hands, structured through the shared hand-builder.
//
// Sourced from 2026 NMJL Card Teaching Guide.docx (supplied by the client).
// Three patterns (marked `patternReconstructed: true`) total 13 tiles as
// extracted — likely docx-conversion losses. We reconstruct each to the most
// plausible 14-tile shape based on category/rule; re-verify against a scan
// of the physical card before publishing.

import type { NmjlHand } from './types'
import { buildHand, type HandRow } from './hand-builder'

// Rows extracted verbatim from the 2026 teaching guide. "X" → concealed:false,
// "C" → concealed:true. Points are the printed value on the card.
const ROWS: HandRow[] = [
  // 2026 --------------------------------------------------------------------
  { id: '2026-1', category: '2026', pattern: '222 000 2222 6666', suitsRule: 'Any 2 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '2026-2', category: '2026', pattern: '2026 DDD 2222 DDD', suitsRule: 'Any 2 Suits w Matching Dragons, Kong 2 or 6', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '2026-3', category: '2026', pattern: 'FFF 2026 222 6666', suitsRule: 'Any 3 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '2026-4', category: '2026', pattern: '22 00 222 666 NEWS', suitsRule: 'Any 2 Suits', concealed: false, points: 30, colourGroupsGuessed: true },

  // 2468 --------------------------------------------------------------------
  { id: '2468-1', category: '2468', pattern: '222 444 6666 8888', suitsRule: 'Any 1 or 2 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '2468-2', category: '2468', pattern: 'FF 2222 44 66 8888', suitsRule: 'Any 2 Suits', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: '2468-3', category: '2468', pattern: 'EE 22 444 666 88 WW', suitsRule: 'Any 1 Suit, East and West Only', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: '2468-4', category: '2468', pattern: '2222 DDD 8888 DDD', suitsRule: 'Any 2 Suits w Matching Dragons, These Nos. Only', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '2468-5', category: '2468', pattern: 'FFF 22 44 666 8888', suitsRule: 'Any 1 Suit', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '2468-6', category: '2468', pattern: '2468 2222 D 2222 D', suitsRule: 'Any 3 Suits, Like Kongs 2,4,6 or 8 w Matching Dragon', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '2468-7', category: '2468', pattern: 'FFF 2468 FFF 2222', suitsRule: 'Any 2 Suits, Kong 2,4,6 or 8', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: '2468-8', category: '2468', pattern: 'FF 246 888 246 888', suitsRule: 'Any 2 Suits', concealed: true, points: 30, colourGroupsGuessed: true },

  // Any Like Numbers --------------------------------------------------------
  // NOTE(pattern): card text reads "1111 FFFFF 1111" (=13). Reconstructed to
  // quint-flowers-quint (5+4+5) pending card-scan verification.
  { id: 'aln-1', category: 'any-like-numbers', pattern: '11111 FFFF 11111', suitsRule: 'Any 2 Suits', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: 'aln-2', category: 'any-like-numbers', pattern: '1111 D 111 D 1111 D', suitsRule: 'Any 3 Suits w Matching Dragon', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'aln-3', category: 'any-like-numbers', pattern: 'FF 1111 11 1111 DD', suitsRule: 'Any 3 Suits w Any Dragon', concealed: false, points: 25, colourGroupsGuessed: true },

  // Quints ------------------------------------------------------------------
  { id: 'q-1', category: 'quints', pattern: '11111 1111 11111', suitsRule: 'Any 3 Suits, Any Like Nos.', concealed: false, points: 40, colourGroupsGuessed: true },
  { id: 'q-2', category: 'quints', pattern: 'FF 11111 22 33333', suitsRule: 'Any 1 Suit, Any 3 Consec. Nos.', concealed: false, points: 45, colourGroupsGuessed: true },
  // NOTE(pattern): card text reads "1111 44444 DDDD" (=13). Reconstructed to
  // two quints + dragon kong (5+5+4) pending card-scan verification.
  { id: 'q-3', category: 'quints', pattern: '11111 44444 DDDD', suitsRule: 'Any 2 Nos. in Any 1 Suit w Opp. Dragon', concealed: false, points: 40, colourGroupsGuessed: true },

  // Consecutive Run --------------------------------------------------------
  { id: 'cr-1a', category: 'consecutive-run', pattern: '11 222 33 444 5555', suitsRule: 'Any 1 Suit, These Nos. Only', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'cr-1b', category: 'consecutive-run', pattern: '55 666 77 888 9999', suitsRule: 'Any 1 Suit, These Nos. Only', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'cr-2', category: 'consecutive-run', pattern: 'FFF 1111 234 5555', suitsRule: 'Any 1 or 2 Suits, Any 5 Consec. Nos.', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'cr-3', category: 'consecutive-run', pattern: '11 22 111 222 3333', suitsRule: 'Any 3 Suits, Any 3 Consec. Nos.', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'cr-4', category: 'consecutive-run', pattern: '111 222 3333 4444', suitsRule: 'Any 1 or 2 Suits, Any 4 Consec. Nos.', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'cr-5', category: 'consecutive-run', pattern: 'FFF 11 22 333 DDDD', suitsRule: 'Any 1 or 2 Suits, Any 3 Consec. Nos. w Matching Dragon', concealed: false, points: 25, colourGroupsGuessed: true },
  // NOTE(pattern): card text reads "1111 FFFFF 2222" (=13). Reconstructed to
  // quint-flowers-quint (5+4+5) pending card-scan verification.
  { id: 'cr-6', category: 'consecutive-run', pattern: '11111 FFFF 22222', suitsRule: 'Any 1 Suit, Any 2 Consec. Nos.', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: 'cr-7', category: 'consecutive-run', pattern: 'FF 1111 2222 3333', suitsRule: 'Any 1 or 3 Suits, Any 3 Consec. Nos.', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'cr-8', category: 'consecutive-run', pattern: '1 22 333 1 22 333 44', suitsRule: 'Any 3 Suits, Any 4 Consec. Nos.', concealed: true, points: 35, colourGroupsGuessed: true },

  // 13579 -------------------------------------------------------------------
  { id: '13579-1', category: '13579', pattern: '11 333 55 777 9999', suitsRule: 'Any 1 or 3 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '13579-2a', category: '13579', pattern: '111 333 3333 5555', suitsRule: 'Any 2 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '13579-2b', category: '13579', pattern: '555 7777 777 9999', suitsRule: 'Any 2 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '13579-3', category: '13579', pattern: 'NN 1111 33 5555 SS', suitsRule: 'Any 1 Suit, North and South Only', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: '13579-4', category: '13579', pattern: '113579 1111 1111', suitsRule: 'Any 3 Suits, Pair Any Odd No., Kongs Match Pair', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '13579-5', category: '13579', pattern: 'FFF 11 33 555 DDDD', suitsRule: 'Any 1 Suit w Matching Dragon', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '13579-6', category: '13579', pattern: '11 33 111 333 5555', suitsRule: 'Any 3 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '13579-7', category: '13579', pattern: '1111 33 55 77 9999', suitsRule: 'Any 1 or 2 Suits', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: '13579-8', category: '13579', pattern: 'FF 11 33 55 111 111', suitsRule: 'Any 3 Suits, These Nos. Only', concealed: true, points: 35, colourGroupsGuessed: true },
  { id: '13579-9', category: '13579', pattern: 'FF 135 777 999 DDD', suitsRule: 'Any 1 Suit w Opp. Dragon', concealed: true, points: 30, colourGroupsGuessed: true },

  // Winds & Dragons --------------------------------------------------------
  { id: 'wd-1a', category: 'winds-dragons', pattern: 'NNNN EEE WWW SSSS', suitsRule: '', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-1b', category: 'winds-dragons', pattern: 'NNN EEEE WWWW SSS', suitsRule: '', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-2', category: 'winds-dragons', pattern: '1234 DDD DDD DDDD', suitsRule: 'Any 4 Consec. Nos. in Any 1 Suit, Any 3 Dragons', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-3', category: 'winds-dragons', pattern: 'NNN 1111 1111 SSS', suitsRule: 'Any Like Odd Nos. in Any 2 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-4', category: 'winds-dragons', pattern: 'EEE 2222 2222 WWW', suitsRule: 'Any Like Even Nos. in Any 2 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-5', category: 'winds-dragons', pattern: 'FFF NNNN FFF DDDD', suitsRule: 'Any Wind, Any Dragon', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-6', category: 'winds-dragons', pattern: '1 N 2 EE 3 WWW 4 SSSS', suitsRule: 'Any 1 Suit, These Nos. Only', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-7', category: 'winds-dragons', pattern: 'FF NNNN SSSS DD DD', suitsRule: 'Any 2 Dragons', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: 'wd-8', category: 'winds-dragons', pattern: 'NN EEE 2026 WWW SS', suitsRule: '2026 Any 1 Suit', concealed: true, points: 30, colourGroupsGuessed: true },

  // 369 ---------------------------------------------------------------------
  { id: '369-1', category: '369', pattern: '333 666 6666 9999', suitsRule: 'Any 2 or 3 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '369-2', category: '369', pattern: '33 66 333 666 9999', suitsRule: 'Any 3 Suits', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '369-3', category: '369', pattern: 'FFF 33 666 99 DDDD', suitsRule: 'Any 1 Suit w Matching or Opp. Dragon', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '369-4', category: '369', pattern: '33 66 666 999 NEWS', suitsRule: 'Any 2 Suits', concealed: false, points: 30, colourGroupsGuessed: true },
  { id: '369-5', category: '369', pattern: 'FF 3369 3333 3333', suitsRule: 'Any 3 Suits, Pair 3,6, or 9, Kongs Match Pair', concealed: false, points: 25, colourGroupsGuessed: true },
  { id: '369-6', category: '369', pattern: 'FF 333 666 999 369', suitsRule: 'Any 2 Suits', concealed: true, points: 30, colourGroupsGuessed: true },

  // Singles & Pairs --------------------------------------------------------
  { id: 'sp-1', category: 'singles-and-pairs', pattern: 'NN EE WW SS 1D 1D 1D', suitsRule: 'Any 3 Suits, Any Like No. w Matching Dragon', concealed: true, points: 50, colourGroupsGuessed: true },
  { id: 'sp-2', category: 'singles-and-pairs', pattern: '2 4 66 88 2 4 66 88 88', suitsRule: 'Any 3 Suits, These Nos. Only', concealed: true, points: 50, colourGroupsGuessed: true },
  { id: 'sp-3', category: 'singles-and-pairs', pattern: 'FF 3369 3669 3699', suitsRule: 'Any 3 Suits', concealed: true, points: 50, colourGroupsGuessed: true },
  { id: 'sp-4', category: 'singles-and-pairs', pattern: '11 22 33 44 55 66 77', suitsRule: 'Any 1 Suit, Any 7 Consec. Nos.', concealed: true, points: 50, colourGroupsGuessed: true },
  { id: 'sp-5', category: 'singles-and-pairs', pattern: '11 357 99 11 357 99', suitsRule: 'Any 2 Suits', concealed: true, points: 50, colourGroupsGuessed: true },
  { id: 'sp-6', category: 'singles-and-pairs', pattern: 'FF 2026 2026 2026', suitsRule: 'Any 3 Suits', concealed: true, points: 75, colourGroupsGuessed: true },
]

export const NMJL_2026_HANDS: NmjlHand[] = ROWS.map(buildHand)
