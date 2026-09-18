import { describe, it, expect } from 'vitest'
import { createClient } from '../../src/client'

// Integration tests are silently skipped unless LIPAD_DARAJA_CONSUMER_KEY is set.
// Run locally with: LIPAD_DARAJA_CONSUMER_KEY=... npx vitest run tests/integration
describe.skipIf(!process.env['LIPAD_DARAJA_CONSUMER_KEY'])(
  'Daraja integration',
  () => {
    const pay = createClient({
      env: 'sandbox',
      callbackUrl: process.env['LIPAD_CALLBACK_URL'] ?? 'https://example.com/webhooks',
      daraja: {
        consumerKey: process.env['LIPAD_DARAJA_CONSUMER_KEY']!,
        consumerSecret: process.env['LIPAD_DARAJA_CONSUMER_SECRET']!,
        shortcode: process.env['LIPAD_DARAJA_SHORTCODE']!,
        passkey: process.env['LIPAD_DARAJA_PASSKEY']!,
      },
    })

    it('triggers STK push successfully', async () => {
      const result = await pay.daraja!.stkPush({
        phone: '0708374149',
        amount: 1,
        reference: `test-${Date.now()}`,
        description: 'Integration test',
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBeTruthy()
    }, 30_000)

    it('queries a payment status', async () => {
      // First trigger a push to get a checkout request ID
      const push = await pay.daraja!.stkPush({
        phone: '0708374149',
        amount: 1,
        reference: `test-${Date.now()}`,
      })

      const queryResult = await pay.daraja!.payments.query({
        transactionId: push.transactionId,
      })

      expect(['success', 'failed', 'pending']).toContain(queryResult.status)
    }, 30_000)
  }
)
