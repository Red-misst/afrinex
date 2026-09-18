import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '../../../../src/providers/jenga/webhooks'

const FIXTURES_DIR = join(__dirname, '../../../fixtures/jenga')

function loadFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(join(FIXTURES_DIR, name), 'utf8')
  )
}

describe('Jenga webhooks.parse', () => {
  describe('SUCCESS status', () => {
    const payload = loadFixture('payment-callback.json')
    const result = parse(payload)

    it('sets event to payment.success', () => {
      expect(result.event).toBe('payment.success')
    })

    it('sets provider to jenga', () => {
      expect(result.provider).toBe('jenga')
    })

    it('extracts transactionId', () => {
      expect(result.transactionId).toBe('FT19191234567890')
    })

    it('extracts amount', () => {
      expect(result.amount).toBe(500)
    })

    it('normalizes destination phone', () => {
      expect(result.phone).toBe('254712345678')
    })

    it('includes completedAt', () => {
      expect(result.completedAt).toBeDefined()
    })
  })

  describe('FAILED status (inline payload)', () => {
    const failedPayload = {
      transactionReference: 'FT19191234567891',
      amount: 200,
      status: 'FAILED',
      destinationAccountNumber: '254700000000',
    }

    it('sets event to payment.failed', () => {
      expect(parse(failedPayload).event).toBe('payment.failed')
    })

    it('does not include completedAt', () => {
      expect(parse(failedPayload).completedAt).toBeUndefined()
    })
  })

  describe('unknown/pending status (inline payload)', () => {
    const pendingPayload = {
      transactionReference: 'FT19191234567892',
      amount: 100,
      status: 'PROCESSING',
    }

    it('maps unknown status to payment.pending', () => {
      expect(parse(pendingPayload).event).toBe('payment.pending')
    })
  })
})
