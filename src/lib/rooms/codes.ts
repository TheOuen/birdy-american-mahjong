// Room codes — short, shareable, and unambiguous for an audience that
// reads them aloud over the phone. No I/O/0/1 lookalikes.

export const ROOM_CODE_LENGTH = 6

// A–Z minus I and O, digits 2–9 (no 0 or 1). 32 characters.
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  // Codes gate room entry, so draw from a CSPRNG (Web Crypto - available in
  // Node 18+, edge runtimes, and browsers), never Math.random(). The 32-char
  // alphabet divides 256 evenly, so the modulo introduces no bias.
  const bytes = new Uint8Array(ROOM_CODE_LENGTH)
  globalThis.crypto.getRandomValues(bytes)
  let code = ''
  for (const b of bytes) {
    code += ROOM_CODE_ALPHABET[b % ROOM_CODE_ALPHABET.length]
  }
  return code
}

// Trim + uppercase so 'abc234' and ' ABC234 ' both resolve to 'ABC234'.
export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isValidRoomCode(code: string): boolean {
  const normalized = normalizeRoomCode(code)
  if (normalized.length !== ROOM_CODE_LENGTH) return false
  for (const char of normalized) {
    if (!ROOM_CODE_ALPHABET.includes(char)) return false
  }
  return true
}
