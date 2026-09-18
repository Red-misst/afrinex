import { describe, it, expect } from 'vitest'
import { normalizePhone } from '../../../src/core/phone'
import { ConfigurationError } from '../../../src/errors/config-error'

describe('normalizePhone', () => {
  it('normalizes 07XX format', () => {
    expect(normalizePhone('0712345678')).toBe('254712345678')
  })

  it('normalizes 01XX format', () => {
    expect(normalizePhone('0112345678')).toBe('254112345678')
  })

  it('normalizes +2547XX format (strips leading +)', () => {
    expect(normalizePhone('+254712345678')).toBe('254712345678')
  })

  it('passes through already-normalized 2547XX format', () => {
    expect(normalizePhone('254712345678')).toBe('254712345678')
  })

  it('strips whitespace before normalizing', () => {
    expect(normalizePhone(' 0712345678 ')).toBe('254712345678')
  })

  it('strips hyphens before normalizing', () => {
    expect(normalizePhone('07-123-45678')).toBe('254712345678')
  })

  it('throws ConfigurationError for Tanzanian number', () => {
    expect(() => normalizePhone('+255712345678')).toThrowError(ConfigurationError)
    expect(() => normalizePhone('+255712345678')).toThrow('Invalid phone number')
  })

  it('throws ConfigurationError for empty string', () => {
    expect(() => normalizePhone('')).toThrowError(ConfigurationError)
  })

  it('throws ConfigurationError for too-short number', () => {
    expect(() => normalizePhone('07123')).toThrowError(ConfigurationError)
  })

  it('throws ConfigurationError for non-numeric garbage', () => {
    expect(() => normalizePhone('not-a-phone')).toThrowError(ConfigurationError)
  })

  it('error message includes the original input', () => {
    try {
      normalizePhone('bad-number')
    } catch (err) {
      expect((err as Error).message).toContain('bad-number')
    }
  })
})
