import { describe, it, expect } from 'vitest'
import { validateContact } from './contact'

describe('validateContact', () => {
  it('accepts a valid submission', () => {
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hello there', topic: 'lessons' }))
      .toEqual({ name: 'Ann', email: 'ann@example.com', message: 'Hello there', topic: 'lessons' })
  })
  it('defaults a missing or unknown topic to general', () => {
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hi' })?.topic).toBe('general')
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hi', topic: 'spam' })?.topic).toBe('general')
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hi', topic: 42 })?.topic).toBe('general')
  })
  it('rejects missing fields', () => {
    expect(validateContact({ name: 'Ann', email: 'ann@example.com' })).toBeNull()
    expect(validateContact(null)).toBeNull()
    expect(validateContact('nope')).toBeNull()
  })
  it('rejects invalid email', () => {
    expect(validateContact({ name: 'Ann', email: 'not-an-email', message: 'Hi' })).toBeNull()
  })
  it('rejects oversized message', () => {
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'x'.repeat(5001) })).toBeNull()
  })
  it('trims whitespace', () => {
    expect(validateContact({ name: '  Ann ', email: ' ann@example.com ', message: ' Hi there ' }))
      .toEqual({ name: 'Ann', email: 'ann@example.com', message: 'Hi there', topic: 'general' })
  })
})
