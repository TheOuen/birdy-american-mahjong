import { describe, it, expect } from 'vitest'
import { londonInputToDate, dateToLondonInput, formatLondon, gcalDates } from './bookings'

describe('londonInputToDate', () => {
  it('treats summer input as BST (UTC+1)', () => {
    expect(londonInputToDate('2026-07-20T14:00')?.toISOString()).toBe('2026-07-20T13:00:00.000Z')
  })

  it('treats winter input as GMT (UTC+0)', () => {
    expect(londonInputToDate('2026-01-20T14:00')?.toISOString()).toBe('2026-01-20T14:00:00.000Z')
  })

  it('rejects malformed input', () => {
    expect(londonInputToDate('')).toBeNull()
    expect(londonInputToDate('20 July 2pm')).toBeNull()
  })
})

describe('dateToLondonInput', () => {
  it('round-trips summer and winter instants', () => {
    expect(dateToLondonInput('2026-07-20T13:00:00.000Z')).toBe('2026-07-20T14:00')
    expect(dateToLondonInput('2026-01-20T14:00:00.000Z')).toBe('2026-01-20T14:00')
  })

  it('returns empty string for bad input', () => {
    expect(dateToLondonInput('nope')).toBe('')
  })
})

describe('formatLondon', () => {
  it('formats in friendly London wording', () => {
    expect(formatLondon('2026-07-20T13:00:00.000Z')).toBe('Monday, 20 July 2026, 2:00 pm')
  })
})

describe('gcalDates', () => {
  it('emits a start/end UTC range', () => {
    expect(gcalDates('2026-07-20T13:00:00.000Z', 60)).toBe('20260720T130000Z/20260720T140000Z')
  })
})
