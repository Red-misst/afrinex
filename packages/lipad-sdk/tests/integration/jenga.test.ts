import { describe, it, expect } from 'vitest'
import { createClient } from '../../src/client'

// Integration tests are silently skipped unless LIPAD_JENGA_API_KEY is set.
describe.skipIf(!process.env['LIPAD_JENGA_API_KEY'])(
  'Jenga integration',
  () => {
    const pay = createClient({
      env: 'sandbox',
      callbackUrl: process.env['LIPAD_CALLBACK_URL'] ?? 'https://example.com/webhooks',
      jenga: {
        apiKey: process.env['LIPAD_JENGA_API_KEY']!,
        merchantCode: process.env['LIPAD_JENGA_MERCHANT_CODE']!,
        consumerSecret: process.env['LIPAD_JENGA_CONSUMER_SECRET']!,
        ...(process.env['LIPAD_JENGA_PRIVATE_KEY'] !== undefined
          ? { privateKey: process.env['LIPAD_JENGA_PRIVATE_KEY'] }
          : {}),
      },
    })

    it('triggers STK push successfully', async () => {
      const result = await pay.jenga!.stkPush({
        phone: '0708374149',
        amount: 10,
        reference: `test-${Date.now()}`,
        description: 'Integration test',
      })

      expect(result.transactionId).toBeTruthy()
    }, 30_000)
  }
)
