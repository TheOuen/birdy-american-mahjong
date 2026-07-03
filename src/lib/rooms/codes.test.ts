import { describe, it, expect } from 'vitest'
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
} from './codes'

describe('generateRoomCode', () => {
  it('produces codes of the right length', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRoomCode()).toHaveLength(ROOM_CODE_LENGTH)
    }
  })

  it('only uses the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode()
      for (const char of code) {
        expect(ROOM_CODE_ALPHABET).toContain(char)
      }
    }
  })

  it('never contains lookalike characters (I, O, 0, 1)', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateRoomCode()).not.toMatch(/[IO01]/)
    }
  })

  it('generated codes always validate', () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidRoomCode(generateRoomCode())).toBe(true)
    }
  })
})

describe('isValidRoomCode', () => {
  it('accepts a well-formed 6-char code', () => {
    expect(isValidRoomCode('ABC234')).toBe(true)
    expect(isValidRoomCode('ZZZZZZ')).toBe(true)
    expect(isValidRoomCode('299999')).toBe(true)
  })

  it('rejects wrong lengths', () => {
    expect(isValidRoomCode('')).toBe(false)
    expect(isValidRoomCode('ABC23')).toBe(false)
    expect(isValidRoomCode('ABC2345')).toBe(false)
  })

  it('rejects lookalike characters', () => {
    expect(isValidRoomCode('ABC230')).toBe(false) // zero
    expect(isValidRoomCode('ABCO23')).toBe(false) // letter O
    expect(isValidRoomCode('ABC231')).toBe(false) // one
    expect(isValidRoomCode('ABCI23')).toBe(false) // letter I
  })

  it('rejects symbols and whitespace inside the code', () => {
    expect(isValidRoomCode('AB C23')).toBe(false)
    expect(isValidRoomCode('ABC-23')).toBe(false)
    expect(isValidRoomCode('ABC23!')).toBe(false)
  })

  it('accepts lowercase input via uppercase normalisation', () => {
    expect(isValidRoomCode('abc234')).toBe(true)
    expect(isValidRoomCode('AbC234')).toBe(true)
  })

  it('accepts input with surrounding whitespace', () => {
    expect(isValidRoomCode('  ABC234 ')).toBe(true)
  })
})

describe('normalizeRoomCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeRoomCode('  abc234 ')).toBe('ABC234')
    expect(normalizeRoomCode('XYZ789')).toBe('XYZ789')
  })
})
