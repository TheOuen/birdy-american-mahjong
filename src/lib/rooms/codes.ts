// Room codes — short, shareable, and unambiguous for an audience that
// reads them aloud over the phone. No I/O/0/1 lookalikes.

export const ROOM_CODE_LENGTH = 6

// A–Z minus I and O, digits 2–9 (no 0 or 1). 32 characters.
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]
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
