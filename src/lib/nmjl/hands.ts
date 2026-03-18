import type { NmjlHand } from './types'

export const NMJL_2025_HANDS: NmjlHand[] = [
  // 2025
  { id: '2025-1', category: '2025', pattern: 'FFFF 2025 222 222', suitsRule: 'Any 3 Suits, Like Pungs 2s or 5s in Opp. Suits', concealed: false, points: 25 },
  { id: '2025-2', category: '2025', pattern: '222 0000 222 5555', suitsRule: 'Any 2 Suits', concealed: false, points: 25 },
  { id: '2025-3', category: '2025', pattern: '2025 222 555 DDDD', suitsRule: 'Any 3 Suits', concealed: false, points: 30 },
  { id: '2025-4', category: '2025', pattern: 'FF 222 000 222 555', suitsRule: 'Any 3 Suits', concealed: true, points: 30 },

  // 2468
  { id: '2468-1', category: '2468', pattern: '222 4444 666 8888', suitsRule: 'Any 1 or 2 Suits', concealed: false, points: 25 },
  { id: '2468-2', category: '2468', pattern: 'FF 2222 + 4444 = 6666', suitsRule: 'Any 1 or 2 Suits', concealed: false, points: 25 },
  { id: '2468-3', category: '2468', pattern: '22 444 66 888 DDDD', suitsRule: 'Any 1 Suit', concealed: false, points: 25 },
  { id: '2468-4', category: '2468', pattern: 'FFFF 2468 222 222', suitsRule: 'Any 3 Suits, Like Pungs Any Even No.', concealed: false, points: 25 },
  { id: '2468-5', category: '2468', pattern: 'FFF 22 44 666 8888', suitsRule: 'Any 1 Suit', concealed: false, points: 25 },
  { id: '2468-6', category: '2468', pattern: '222 4444 666 88 88', suitsRule: 'Any 3 Suits, Pairs 8s Only', concealed: false, points: 25 },
  { id: '2468-7', category: '2468', pattern: 'FF 2222 DDDD 2222', suitsRule: 'Any 3 Suits, Like Kongs Any Even No.', concealed: false, points: 25 },
  { id: '2468-8', category: '2468', pattern: '22 44 66 88 222 222', suitsRule: 'Any 3 Suits, Like Pungs Any Even No.', concealed: true, points: 30 },

  // Any Like Numbers
  { id: 'aln-1', category: 'any-like-numbers', pattern: 'FF 1111 D 1111 D 11', suitsRule: 'Any 3 Suits', concealed: false, points: 25 },
  { id: 'aln-2', category: 'any-like-numbers', pattern: 'FFFF 11 111 111 11', suitsRule: 'Any 3 Suits, Pairs Must Be Same Suit', concealed: false, points: 30 },
  { id: 'aln-3', category: 'any-like-numbers', pattern: 'FF 111 111 111 DDD', suitsRule: 'Any 3 Suits, Any Dragon', concealed: true, points: 30 },

  // Quints
  { id: 'q-1', category: 'quints', pattern: 'FF 111 2222 33333', suitsRule: 'Any 3 Suits, Any 3 Consec. Nos.', concealed: false, points: 35 },
  { id: 'q-2', category: 'quints', pattern: '11111 NNNN 22222', suitsRule: 'Any 1 Suit, Any 2 Consec. Nos., Any Wind', concealed: false, points: 35 },
  { id: 'q-3', category: 'quints', pattern: 'FF 11111 11 11111', suitsRule: 'Any 3 Suits, Any Like Nos.', concealed: false, points: 35 },

  // Consecutive Run
  { id: 'cr-1a', category: 'consecutive-run', pattern: '11 222 3333 444 55', suitsRule: 'Any 1 Suit, These Nos. Only', concealed: false, points: 25 },
  { id: 'cr-1b', category: 'consecutive-run', pattern: '55 666 7777 888 99', suitsRule: 'Any 1 Suit, These Nos. Only', concealed: false, points: 25 },
  { id: 'cr-2', category: 'consecutive-run', pattern: '111 2222 333 4444', suitsRule: 'Any 1 or 2 Suits, Any 4 Consec. Nos.', concealed: false, points: 25 },
  { id: 'cr-3', category: 'consecutive-run', pattern: 'FFFF 1111 22 3333', suitsRule: 'Any 1 or 3 Suits, Any 3 Consec. Nos.', concealed: false, points: 25 },
  { id: 'cr-4', category: 'consecutive-run', pattern: 'FFF 123 4444 5555', suitsRule: 'Any 3 Suits, Any 5 Consec. Nos.', concealed: false, points: 25 },
  { id: 'cr-5', category: 'consecutive-run', pattern: 'FF 11 222 333 DDD', suitsRule: 'Any 1 Suit, Any 3 Consec. Nos.', concealed: false, points: 25 },
  { id: 'cr-6', category: 'consecutive-run', pattern: '111 222 3333 DD DD', suitsRule: 'Any 3 Consec. Nos. w Opp. Dragons', concealed: false, points: 25 },
  { id: 'cr-7', category: 'consecutive-run', pattern: '112345 1111 1111', suitsRule: 'Any 5 Consec. Nos., Pair Any No. in Run, Kongs Match Pair', concealed: false, points: 30 },
  { id: 'cr-8', category: 'consecutive-run', pattern: 'FF 1 22 333 1 22 333', suitsRule: 'Any 2 Suits, Any Same 3 Consec. Nos.', concealed: true, points: 30 },

  // 13579
  { id: '13579-1', category: '13579', pattern: '11 333 5555 777 99', suitsRule: 'Any 1 or 3 Suits', concealed: false, points: 25 },
  { id: '13579-2a', category: '13579', pattern: '111 3333 333 5555', suitsRule: 'Any 2 Suits', concealed: false, points: 25 },
  { id: '13579-2b', category: '13579', pattern: '555 7777 777 9999', suitsRule: 'Any 2 Suits', concealed: false, points: 25 },
  { id: '13579-3a', category: '13579', pattern: '1111 333 5555 DDD', suitsRule: 'Any 1 Suit', concealed: false, points: 25 },
  { id: '13579-3b', category: '13579', pattern: '5555 777 9999 DDD', suitsRule: 'Any 1 Suit', concealed: false, points: 25 },
  { id: '13579-4a', category: '13579', pattern: 'FFFF 11 1111 9999', suitsRule: 'Any 2 Suits, These Nos. Only', concealed: false, points: 25 },
  { id: '13579-4b', category: '13579', pattern: 'FFFF 1111 9999 99', suitsRule: 'Any 2 Suits, These Nos. Only', concealed: false, points: 25 },
  { id: '13579-5', category: '13579', pattern: 'FFF 135 7777 9999', suitsRule: 'Any 1 or 3 Suits', concealed: false, points: 25 },
  { id: '13579-6', category: '13579', pattern: '111 333 5555 DD DD', suitsRule: 'Any 3 Suits w Opp. Dragons', concealed: false, points: 25 },
  { id: '13579-7a', category: '13579', pattern: '11 333 NEWS 333 55', suitsRule: 'Any 2 Suits', concealed: false, points: 30 },
  { id: '13579-7b', category: '13579', pattern: '55 777 NEWS 777 99', suitsRule: 'Any 2 Suits', concealed: false, points: 30 },
  { id: '13579-8', category: '13579', pattern: '1111 33 55 77 9999', suitsRule: 'Any 3 Suits', concealed: false, points: 30 },
  { id: '13579-9a', category: '13579', pattern: 'FF 11 33 111 333 55', suitsRule: 'Any 2 Suits', concealed: true, points: 30 },
  { id: '13579-9b', category: '13579', pattern: 'FF 55 77 555 777 99', suitsRule: 'Any 2 Suits', concealed: true, points: 30 },

  // Winds & Dragons
  { id: 'wd-1a', category: 'winds-dragons', pattern: 'NNNN EEE WWW SSSS', suitsRule: '', concealed: false, points: 30 },
  { id: 'wd-1b', category: 'winds-dragons', pattern: 'NNN EEEE WWWW SSS', suitsRule: '', concealed: false, points: 30 },
  { id: 'wd-2', category: 'winds-dragons', pattern: 'FF 123 DD DDD DDDD', suitsRule: 'Any 3 Consec. Nos. in Any 1 Suit, Any 3 Dragons', concealed: false, points: 30 },
  { id: 'wd-3', category: 'winds-dragons', pattern: 'FFF NN EE WWW SSSS', suitsRule: '', concealed: false, points: 30 },
  { id: 'wd-4', category: 'winds-dragons', pattern: 'FFFF DDD NEWS DDD', suitsRule: 'Dragons Any 2 Suits', concealed: false, points: 30 },
  { id: 'wd-5', category: 'winds-dragons', pattern: 'NNNN 1 11 111 SSSS', suitsRule: 'Any Like Odd Nos. in 3 Suits', concealed: false, points: 30 },
  { id: 'wd-6', category: 'winds-dragons', pattern: 'EEEE 2 22 222 WWWW', suitsRule: 'Any Like Even Nos. in 3 Suits', concealed: false, points: 30 },
  { id: 'wd-7a', category: 'winds-dragons', pattern: 'NN EEE WWW SS 2025', suitsRule: '2025 Any 1 Suit', concealed: false, points: 30 },
  { id: 'wd-7b', category: 'winds-dragons', pattern: 'NNN EE WW SSS 2025', suitsRule: '2025 Any 1 Suit', concealed: false, points: 30 },
  { id: 'wd-8', category: 'winds-dragons', pattern: 'NN EE WWW SSS DDDD', suitsRule: 'Kong Any Dragon', concealed: false, points: 30 },

  // 369
  { id: '369-1', category: '369', pattern: '333 6666 666 9999', suitsRule: 'Any 2 or 3 Suits', concealed: false, points: 25 },
  { id: '369-2', category: '369', pattern: 'FF 3333 + 6666 = 9999', suitsRule: 'Any 1 or 3 Suits', concealed: false, points: 25 },
  { id: '369-3', category: '369', pattern: '3333 DDD 3333 DDD', suitsRule: 'Any 2 Suits, Like Kongs 3, 6 or 9 w Matching Dragons', concealed: false, points: 25 },
  { id: '369-4', category: '369', pattern: 'FFF 3333 369 9999', suitsRule: 'Any 2 Suits', concealed: false, points: 25 },
  { id: '369-5', category: '369', pattern: '33 66 99 3333 3333', suitsRule: 'Any 3 Suits, Like Kongs 3, 6, or 9', concealed: false, points: 25 },
  { id: '369-6', category: '369', pattern: 'FF 333 D 666 D 999 D', suitsRule: 'Any 3 Suits w Matching Dragons', concealed: false, points: 25 },

  // Singles and Pairs
  { id: 'sp-1', category: 'singles-and-pairs', pattern: 'NN EW SS 11 22 33 44', suitsRule: 'Any 1 Suit, Any 4 Consec. Nos.', concealed: true, points: 30 },
  { id: 'sp-2', category: 'singles-and-pairs', pattern: 'FF 2468 DD 2468 DD', suitsRule: 'Any 2 Suits w Matching Dragons', concealed: true, points: 30 },
  { id: 'sp-3', category: 'singles-and-pairs', pattern: '336699 336699 33', suitsRule: 'Any 3 Suits, Pair 3, 6, or 9 in Third Suit', concealed: true, points: 30 },
  { id: 'sp-4', category: 'singles-and-pairs', pattern: 'FF 11 22 11 22 11 22', suitsRule: 'Any 3 Suits, Any 2 Consec. Nos.', concealed: true, points: 30 },
  { id: 'sp-5', category: 'singles-and-pairs', pattern: '11 33 55 77 99 11 11', suitsRule: 'Any 3 Suits, Pairs Any Like Odd Nos. in Opp. Suits', concealed: true, points: 30 },
  { id: 'sp-6', category: 'singles-and-pairs', pattern: 'FF 2025 2025 2025', suitsRule: 'Any 3 Suits', concealed: true, points: 30 },
]
