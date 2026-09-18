import { describe, it, expect } from 'vitest'
import { createClient } from '../../src/client'

// Integration tests are silently skipped unless LIPAD_BUNI_CONSUMER_KEY is set.
describe.skipIf(!process.env['LIPAD_BUNI_CONSUMER_KEY'])(
  'Buni integration',
  () => {
    const pay = createClient({
      env: 'sandbox',
      callbackUrl: process.env['LIPAD_CALLBACK_URL'] ?? 'https://example.com/webhooks',
      buni: {
        consumerKey: process.env['LIPAD_BUNI_CONSUMER_KEY']!,
        consumerSecret: process.env['LIPAD_BUNI_CONSUMER_SECRET']!,
        orgShortCode: process.env['LIPAD_BUNI_ORG_SHORT_CODE']!,
      },
    })

    it('triggers STK push successfully', async () => {
      const result = await pay.buni!.stkPush({
        phone: '0708374149',
        amount: 10,
        reference: `test-${Date.now()}`,
      })

      expect(result.transactionId).toBeTruthy()
    }, 30_000)
  }
)
