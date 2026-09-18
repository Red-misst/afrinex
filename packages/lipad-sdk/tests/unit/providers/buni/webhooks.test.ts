import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '../../../../src/providers/buni/webhooks'

const FIXTURES_DIR = join(__dirname, '../../../fixtures/buni')

function loadFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(join(FIXTURES_DIR, name), 'utf8')
  )
}

describe('Buni webhooks.parse', () => {
  describe('Pay Bill callback', () => {
    const payload = loadFixture('c2b-callback.json')
    const result = parse(payload)

    it('sets event to payment.success', () => {
      expect(result.event).toBe('payment.success')
    })

    it('sets provider to buni', () => {
      expect(result.provider).toBe('buni')
    })

    it('extracts TransID as transactionId', () => {
      expect(result.transactionId).toBe('RKTQDM7W6S')
    })

    it('extracts amount', () => {
      expect(result.amount).toBe(100)
    })

    it('normalizes MSISDN phone', () => {
      expect(result.phone).toBe('254708374149')
    })

    it('extracts BillRefNumber as reference', () => {
      expect(result.reference).toBe('order-001')
    })

    it('always has completedAt (Buni only sends success callbacks)', () => {
      expect(result.completedAt).toBeDefined()
    })

    it('preserves raw payload', () => {
      expect(result.raw).toEqual(payload)
    })
  })

  describe('inline payload without TransTime', () => {
    const payload = {
      TransactionType: 'Pay Bill',
      TransID: 'ABC123XYZ',
      TransAmount: '50',
      MSISDN: '254700000001',
      BillRefNumber: 'ref-999',
    }

    it('still sets completedAt to a fallback date', () => {
      const result = parse(payload)
      expect(result.completedAt).toBeDefined()
      expect(result.event).toBe('payment.success')
    })
  })
})
