import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resolveCallbackUrl } from '../../../src/core/callback-url'
import { ConfigurationError } from '../../../src/errors/config-error'

describe('resolveCallbackUrl', () => {
  const originalEnv = process.env['LIPAD_CALLBACK_URL']

  beforeEach(() => {
    delete process.env['LIPAD_CALLBACK_URL']
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['LIPAD_CALLBACK_URL'] = originalEnv
    } else {
      delete process.env['LIPAD_CALLBACK_URL']
    }
  })

  describe('priority: request > global > env', () => {
    it('uses request-level URL first', () => {
      const result = resolveCallbackUrl({
        request: 'https://request.com/hooks',
        global: 'https://global.com/hooks',
        provider: 'daraja',
      })
      expect(result).toBe('https://request.com/hooks/daraja')
    })

    it('falls back to global when no request URL', () => {
      const result = resolveCallbackUrl({
        global: 'https://global.com/hooks',
        provider: 'daraja',
      })
      expect(result).toBe('https://global.com/hooks/daraja')
    })

    it('falls back to env var when no request or global URL', () => {
      process.env['LIPAD_CALLBACK_URL'] = 'https://env.com/hooks'
      const result = resolveCallbackUrl({ provider: 'daraja' })
      expect(result).toBe('https://env.com/hooks/daraja')
    })

    it('throws ConfigurationError when no URL is available anywhere', () => {
      expect(() => resolveCallbackUrl({ provider: 'daraja' })).toThrowError(
        ConfigurationError
      )
    })
  })

  describe('trailing slash stripping', () => {
    it('strips single trailing slash', () => {
      const result = resolveCallbackUrl({
        global: 'https://myapp.com/webhooks/',
        provider: 'daraja',
      })
      expect(result).toBe('https://myapp.com/webhooks/daraja')
    })

    it('strips multiple trailing slashes', () => {
      const result = resolveCallbackUrl({
        global: 'https://myapp.com/webhooks///',
        provider: 'daraja',
      })
      expect(result).toBe('https://myapp.com/webhooks/daraja')
    })

    it('does not add extra slash when base has no trailing slash', () => {
      const result = resolveCallbackUrl({
        global: 'https://myapp.com/webhooks',
        provider: 'daraja',
      })
      expect(result).toBe('https://myapp.com/webhooks/daraja')
    })
  })

  describe('provider slug appending', () => {
    const base = 'https://myapp.com/webhooks'

    it('appends /daraja for daraja provider', () => {
      expect(resolveCallbackUrl({ global: base, provider: 'daraja' })).toBe(
        'https://myapp.com/webhooks/daraja'
      )
    })

    it('appends /jenga for jenga provider', () => {
      expect(resolveCallbackUrl({ global: base, provider: 'jenga' })).toBe(
        'https://myapp.com/webhooks/jenga'
      )
    })

    it('appends /buni for buni provider', () => {
      expect(resolveCallbackUrl({ global: base, provider: 'buni' })).toBe(
        'https://myapp.com/webhooks/buni'
      )
    })
  })
})
