import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '../../../../src/providers/daraja/webhooks'

const FIXTURES_DIR = join(__dirname, '../../../fixtures/daraja')

function loadFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(join(FIXTURES_DIR, name), 'utf8')
  )
}

describe('Daraja webhooks.parse', () => {
  describe('success callback (ResultCode: 0)', () => {
    const payload = loadFixture('stk-callback-success.json')
    const result = parse(payload)

    it('sets event to payment.success', () => {
      expect(result.event).toBe('payment.success')
    })

    it('sets provider to daraja', () => {
      expect(result.provider).toBe('daraja')
    })

    it('uses MpesaReceiptNumber as transactionId', () => {
      expect(result.transactionId).toBe('NLJ7RT61SV')
    })

    it('extracts amount from CallbackMetadata', () => {
      expect(result.amount).toBe(1)
    })

    it('normalizes phone to 254 format', () => {
      expect(result.phone).toBe('254708374149')
    })

    it('includes completedAt for success', () => {
      expect(result.completedAt).toBeDefined()
      expect(typeof result.completedAt).toBe('string')
    })

    it('preserves raw payload', () => {
      expect(result.raw).toEqual(payload)
    })
  })

  describe('failed callback (ResultCode: 1032)', () => {
    const payload = loadFixture('stk-callback-failed.json')
    const result = parse(payload)

    it('sets event to payment.failed', () => {
      expect(result.event).toBe('payment.failed')
    })

    it('falls back to CheckoutRequestID as transactionId when no receipt', () => {
      expect(result.transactionId).toBe('ws_CO_191220191020363926')
    })

    it('does not include completedAt for failed', () => {
      expect(result.completedAt).toBeUndefined()
    })

    it('amount is 0 (no metadata on failure)', () => {
      expect(result.amount).toBe(0)
    })
  })
})
