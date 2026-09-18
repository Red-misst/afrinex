# lipad

> Unified payments SDK for Kenya — Safaricom Daraja, Equity Jenga, KCB Buni

[![npm version](https://img.shields.io/npm/v/lipad)](https://www.npmjs.com/package/lipad)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

`lipad` wraps Kenya's three major payment providers behind a single, type-safe interface:

| Provider | Bank | Product |
|---|---|---|
| **Daraja** | Safaricom | M-Pesa STK Push, B2C |
| **Jenga** | Equity Bank | Mobile Money STK Push, Transfers |
| **Buni** | KCB Bank | C2B Express Checkout, B2C |

---

## Quickstart

Get a working STK push in under 10 minutes.

```bash
npm install lipad
```

```typescript
import { createClient } from 'lipad'

const pay = createClient({
  env: 'sandbox',
  callbackUrl: 'https://myapp.com/webhooks',
  daraja: {
    consumerKey: process.env.DARAJA_KEY!,
    consumerSecret: process.env.DARAJA_SECRET!,
    shortcode: '174379',
    passkey: process.env.DARAJA_PASSKEY!,
  },
})

const result = await pay.daraja!.stkPush({
  phone: '0712345678',
  amount: 1,
  reference: 'order-001',
})

console.log(result.transactionId)
```

---

## Multi-Provider Example

```typescript
import { createClient } from 'lipad'

const pay = createClient({
  env: 'sandbox',
  callbackUrl: 'https://myapp.com/webhooks',
  daraja: {
    consumerKey: process.env.LIPAD_DARAJA_CONSUMER_KEY!,
    consumerSecret: process.env.LIPAD_DARAJA_CONSUMER_SECRET!,
    shortcode: '174379',
    passkey: process.env.LIPAD_DARAJA_PASSKEY!,
  },
  jenga: {
    apiKey: process.env.LIPAD_JENGA_API_KEY!,
    merchantCode: process.env.LIPAD_JENGA_MERCHANT_CODE!,
    consumerSecret: process.env.LIPAD_JENGA_CONSUMER_SECRET!,
  },
  buni: {
    consumerKey: process.env.LIPAD_BUNI_CONSUMER_KEY!,
    consumerSecret: process.env.LIPAD_BUNI_CONSUMER_SECRET!,
    orgShortCode: process.env.LIPAD_BUNI_ORG_SHORT_CODE!,
  },
})

// Trigger STK push with any provider
await pay.daraja?.stkPush({ phone: '0712345678', amount: 100, reference: 'inv-001' })
await pay.jenga?.stkPush({ phone: '0712345678', amount: 100, reference: 'inv-001' })
await pay.buni?.stkPush({ phone: '0712345678', amount: 100, reference: 'inv-001' })
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

All credentials can be passed directly to `createClient()` **or** via environment variables — the SDK checks both, with explicit config taking priority.

---

## Webhook Parsing

All providers return a unified `UnifiedWebhookPayload`:

```typescript
// Express example
app.post('/webhooks/daraja', (req, res) => {
  const event = pay.daraja!.webhooks.parse(req.body)

  if (event.event === 'payment.success') {
    console.log(`✓ KES ${event.amount} from ${event.phone} — ref: ${event.reference}`)
  }

  res.sendStatus(200)
})
```

---

## Error Handling

```typescript
import { createClient, ProviderError, ConfigurationError, AuthError } from 'lipad'

try {
  await pay.daraja!.stkPush({ ... })
} catch (err) {
  if (err instanceof ConfigurationError) {
    // Missing or invalid config
  } else if (err instanceof AuthError) {
    // Token fetch / signing failed
  } else if (err instanceof ProviderError) {
    console.error(err.providerCode, err.providerMessage)
    console.error(err.raw) // full provider response
  }
}
```

---

## Supported Operations

| Operation | Daraja | Jenga | Buni |
|---|:---:|:---:|:---:|
| STK Push (C2B) | ✅ | ✅ | ✅ |
| Transfer to Phone (B2C) | 🔜 v1.1 | ✅ | ✅ |
| Payment Query | ✅ | ✅ | ✅ |
| Webhook Parse | ✅ | ✅ | ✅ |

---

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run unit tests
npm run test:unit

# Run integration tests (requires .env with real credentials)
npm run test:integration
```

---

## License

MIT © lipad contributors
