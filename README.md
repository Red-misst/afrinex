# lipad

> One SDK. Two providers. M-Pesa and KCB payments for Kenya — done right.

[![npm version](https://img.shields.io/npm/v/lipad)](https://www.npmjs.com/package/lipad)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## What is Lipad?

If you've ever tried to integrate M-Pesa (Safaricom Daraja) or KCB (Buni) payments in a Node.js app, you know the pain:

- Each provider has a completely different API shape
- Auth flows differ (OAuth2 vs basic tokens)
- Webhooks are formatted differently per provider
- You have to write and maintain separate integration code for each one

**Lipad solves this.** It wraps both providers behind a single, consistent interface:

- Same method names across providers (`stkPush`, `transfers.toPhone`, `payments.query`)
- Same response shape regardless of which provider you use
- Same webhook format — parse once, handle everywhere
- Full TypeScript support with autocomplete and type safety
- Environment variable fallback so credentials stay out of your code

You write your payment logic once. Lipad handles the rest.

---

## Supported Providers

| Provider | Bank | What You Can Do |
|---|---|---|
| **daraja** | Safaricom | M-Pesa STK Push (C2B), Payment Query, Webhook Parsing |
| **buni** | KCB Bank | STK Push (C2B Express Checkout), Transfer to Phone (B2C), Payment Query, Webhook Parsing |

> **Sandbox-first design** — Both providers offer free sandbox environments. You can build and test everything without spending a shilling.

---

## Requirements

- **Node.js** v18 or higher
- A **Safaricom Developer** account (for Daraja) → [developer.safaricom.co.ke](https://developer.safaricom.co.ke/)
- A **KCB Developer** account (for Buni) → [developer.kcbgroup.com](https://developer.kcbgroup.com/)

---

## Installation

```bash
npm install lipad
```

```bash
yarn add lipad
```

```bash
pnpm add lipad
```

---

## Getting Your Credentials

Before you can run any code, you need API credentials from each provider's developer portal. Here's exactly where to get them:

### Daraja (Safaricom M-Pesa)

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke/) and create a free account
2. Click **My Apps → Create New App**
3. Select **Lipa Na M-Pesa Online** (this is STK Push)
4. After creating the app, click on it to see:
   - `Consumer Key` → your `consumerKey`
   - `Consumer Secret` → your `consumerSecret`
5. For the **shortcode** and **passkey**, use Safaricom's sandbox test credentials:
   - Shortcode: `174379`
   - Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

### Buni (KCB Bank)

1. Go to [developer.kcbgroup.com](https://developer.kcbgroup.com/) and create a free account
2. Create a new application
3. After creating the app, you'll find:
   - `Consumer Key` → your `consumerKey`
   - `Consumer Secret` → your `consumerSecret`
4. For the **orgShortCode**, use KCB's sandbox short code: `522522`

---

## Quickstart (5 minutes to your first STK Push)

### Step 1 — Set up environment variables

Create a `.env` file in your project root:

```bash
# Daraja (Safaricom M-Pesa)
LIPAD_DARAJA_CONSUMER_KEY=your_consumer_key_here
LIPAD_DARAJA_CONSUMER_SECRET=your_consumer_secret_here
LIPAD_DARAJA_SHORTCODE=174379
LIPAD_DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Your callback URL (where M-Pesa sends payment confirmations)
LIPAD_CALLBACK_URL=https://your-domain.com/webhooks
```

### Step 2 — Install dotenv (if you haven't already)

```bash
npm install dotenv
```

### Step 3 — Write your first integration

```typescript
import 'dotenv/config'
import { createClient } from 'lipad'

// Create the client — only the providers you configure are loaded
const pay = createClient({
  env: 'sandbox',         // Use 'production' when you go live
  callbackUrl: process.env.LIPAD_CALLBACK_URL,
  daraja: {
    consumerKey:    process.env.LIPAD_DARAJA_CONSUMER_KEY!,
    consumerSecret: process.env.LIPAD_DARAJA_CONSUMER_SECRET!,
    shortcode:      process.env.LIPAD_DARAJA_SHORTCODE!,
    passkey:        process.env.LIPAD_DARAJA_PASSKEY!,
  },
})

// Trigger an M-Pesa STK Push (sends a payment prompt to the user's phone)
const result = await pay.daraja!.stkPush({
  phone: '0712345678',   // Accepts 07XX, +2547XX, or 2547XX format
  amount: 1,             // Amount in KES (minimum is 1)
  reference: 'order-001' // Your internal order/invoice ID
})

console.log('Transaction ID:', result.transactionId)
// The user will receive an M-Pesa prompt on their phone asking them to enter their PIN
```

That's it. You just sent an STK push to a phone.

---

## Full API Reference

### `createClient(config)`

Creates a Lipad client. Only providers you pass config for are instantiated.

```typescript
import { createClient } from 'lipad'

const pay = createClient({
  env: 'sandbox',             // Required: 'sandbox' | 'production'
  callbackUrl: 'https://...', // Optional: global callback URL for webhooks
  daraja: { ... },            // Optional: include to enable M-Pesa
  buni: { ... },              // Optional: include to enable KCB
})
```

---

### Daraja (M-Pesa) Methods

#### `pay.daraja!.stkPush(request)`

Sends an STK Push — a payment prompt directly to the customer's phone. The customer sees a PIN dialog and confirms the payment.

```typescript
const result = await pay.daraja!.stkPush({
  phone: '0712345678',              // Customer's phone number
  amount: 500,                      // Amount in KES
  reference: 'INV-2024-001',        // Your reference/invoice number
  description: 'Payment for order', // Optional: appears in M-Pesa message
  callbackUrl: 'https://...',       // Optional: overrides the global callbackUrl
})

// result:
// {
//   success: true,
//   transactionId: 'ws_CO_...',   ← use this to query payment status later
//   message: 'Success. Request accepted for processing',
//   raw: { ... }                  ← full Safaricom API response
// }
```

#### `pay.daraja!.payments.query(request)`

Check the status of a payment after an STK Push. Call this in your callback handler or to poll for status.

```typescript
const status = await pay.daraja!.payments.query({
  transactionId: 'ws_CO_...', // The transactionId from stkPush result
})

// status:
// {
//   transactionId: 'ws_CO_...',
//   status: 'success' | 'failed' | 'pending',
//   amount: 500,
//   phone: '254712345678',
//   reference: 'INV-2024-001',
//   raw: { ... }
// }
```

#### `pay.daraja!.webhooks.parse(payload)`

Parse an incoming M-Pesa webhook notification into a unified format.

```typescript
// In your Express/Fastify/Hono webhook route:
app.post('/webhooks/daraja', (req, res) => {
  const event = pay.daraja!.webhooks.parse(req.body)

  console.log(event.provider)       // 'daraja'
  console.log(event.event)          // 'payment.success' | 'payment.failed' | 'payment.pending'
  console.log(event.transactionId)  // M-Pesa transaction ID
  console.log(event.amount)         // Amount in KES
  console.log(event.phone)          // Always normalized to 2547XXXXXXXX
  console.log(event.reference)      // Your reference/invoice number
  console.log(event.completedAt)    // ISO 8601 timestamp (only on success)

  res.sendStatus(200) // Always respond 200 to acknowledge receipt
})
```

---

### Buni (KCB) Methods

#### `pay.buni!.stkPush(request)`

Same interface as Daraja — sends a payment prompt to the customer's phone via KCB.

```typescript
const pay = createClient({
  env: 'sandbox',
  callbackUrl: 'https://your-domain.com/webhooks',
  buni: {
    consumerKey:    process.env.LIPAD_BUNI_CONSUMER_KEY!,
    consumerSecret: process.env.LIPAD_BUNI_CONSUMER_SECRET!,
    orgShortCode:   process.env.LIPAD_BUNI_ORG_SHORT_CODE!,
  },
})

const result = await pay.buni!.stkPush({
  phone: '0722000000',
  amount: 100,
  reference: 'SCHOOL-FEE-001',
  description: 'School fee payment',
})

console.log(result.transactionId)
```

#### `pay.buni!.transfers.toPhone(request)`

Send money directly to a phone number (B2C — Business to Customer transfer).

```typescript
const result = await pay.buni!.transfers.toPhone({
  phone: '0722000000',
  amount: 500,
  reference: 'PAYOUT-001',
  remarks: 'Staff salary disbursement', // Optional note
})

console.log(result.success)       // true
console.log(result.transactionId) // KCB transaction ID
```

#### `pay.buni!.payments.query(request)`

Check payment status for a Buni transaction.

```typescript
const status = await pay.buni!.payments.query({
  transactionId: 'KCB-TXN-...',
})

console.log(status.status) // 'success' | 'failed' | 'pending'
```

#### `pay.buni!.webhooks.parse(payload)`

Same interface as Daraja webhooks.

```typescript
app.post('/webhooks/buni', (req, res) => {
  const event = pay.buni!.webhooks.parse(req.body)
  
  if (event.event === 'payment.success') {
    console.log(`✓ KES ${event.amount} received from ${event.phone}`)
    // Update your database, fulfill the order, etc.
  }
  
  res.sendStatus(200)
})
```

---

## Using Both Providers Together

You can configure both providers in a single client:

```typescript
import 'dotenv/config'
import { createClient } from 'lipad'

const pay = createClient({
  env: 'sandbox',
  callbackUrl: process.env.LIPAD_CALLBACK_URL,
  daraja: {
    consumerKey:    process.env.LIPAD_DARAJA_CONSUMER_KEY!,
    consumerSecret: process.env.LIPAD_DARAJA_CONSUMER_SECRET!,
    shortcode:      process.env.LIPAD_DARAJA_SHORTCODE!,
    passkey:        process.env.LIPAD_DARAJA_PASSKEY!,
  },
  buni: {
    consumerKey:    process.env.LIPAD_BUNI_CONSUMER_KEY!,
    consumerSecret: process.env.LIPAD_BUNI_CONSUMER_SECRET!,
    orgShortCode:   process.env.LIPAD_BUNI_ORG_SHORT_CODE!,
  },
})

// Let the user choose their preferred mobile money provider
async function initiatePayment(provider: 'safaricom' | 'kcb', phone: string, amount: number) {
  if (provider === 'safaricom') {
    return pay.daraja!.stkPush({ phone, amount, reference: 'ORDER-001' })
  } else {
    return pay.buni!.stkPush({ phone, amount, reference: 'ORDER-001' })
  }
}
```

---

## Environment Variables

All credentials can be passed directly into `createClient()` **or** set as environment variables. The SDK checks both — explicit config takes priority over env vars.

| Variable | Provider | Description |
|---|---|---|
| `LIPAD_DARAJA_CONSUMER_KEY` | Daraja | From Safaricom Developer Portal |
| `LIPAD_DARAJA_CONSUMER_SECRET` | Daraja | From Safaricom Developer Portal |
| `LIPAD_DARAJA_SHORTCODE` | Daraja | Your M-Pesa shortcode |
| `LIPAD_DARAJA_PASSKEY` | Daraja | STK Push passkey |
| `LIPAD_BUNI_CONSUMER_KEY` | Buni | From KCB Developer Portal |
| `LIPAD_BUNI_CONSUMER_SECRET` | Buni | From KCB Developer Portal |
| `LIPAD_BUNI_ORG_SHORT_CODE` | Buni | Your KCB org short code |
| `LIPAD_CALLBACK_URL` | Global | Your webhook endpoint base URL |

Copy `.env.example` to `.env` to get started:

```bash
cp .env.example .env
```

---

## Error Handling

Lipad throws typed errors so you can handle failures precisely:

```typescript
import { createClient, ConfigurationError, AuthError, ProviderError } from 'lipad'

try {
  const result = await pay.daraja!.stkPush({
    phone: '0712345678',
    amount: 100,
    reference: 'order-001',
  })
  console.log('Payment initiated:', result.transactionId)

} catch (err) {
  if (err instanceof ConfigurationError) {
    // A required credential is missing or invalid
    // This is thrown at createClient() time, not at runtime
    console.error('Config error:', err.message)

  } else if (err instanceof AuthError) {
    // Failed to authenticate with the provider (bad credentials, expired token)
    console.error('Auth failed:', err.message)

  } else if (err instanceof ProviderError) {
    // The provider accepted the request but returned an error response
    console.error('Provider error code:', err.providerCode)
    console.error('Provider message:', err.providerMessage)
    console.error('Full response:', err.raw)

  } else {
    // Network error, timeout, or unexpected issue
    throw err
  }
}
```

### Error Types Quick Reference

| Error Class | When It's Thrown |
|---|---|
| `ConfigurationError` | Missing required credential in `createClient()` |
| `AuthError` | Token fetch failed (bad credentials, network issue) |
| `ProviderError` | Provider returned an error response (wrong amount, phone, etc.) |
| `ProviderCapabilityError` | Called a method not supported by that provider |

---

## TypeScript Types

Lipad is written in TypeScript. All types are exported and available:

```typescript
import type {
  LipadConfig,          // Config object for createClient()
  DarajaConfig,         // Daraja-specific config shape
  BuniConfig,           // Buni-specific config shape
  StkPushRequest,       // Input to .stkPush()
  StkPushResponse,      // Output of .stkPush()
  TransferToPhoneRequest,// Input to .transfers.toPhone()
  TransferResponse,     // Output of .transfers.toPhone()
  PaymentQueryRequest,  // Input to .payments.query()
  PaymentQueryResponse, // Output of .payments.query()
  UnifiedWebhookPayload,// Output of .webhooks.parse()
  WebhookEvent,         // 'payment.success' | 'payment.failed' | 'payment.pending'
  ProviderName,         // 'daraja' | 'buni'
  Environment,          // 'sandbox' | 'production'
} from 'lipad'
```

---

## Supported Operations

| Operation | Daraja (M-Pesa) | Buni (KCB) |
|---|:---:|:---:|
| STK Push (C2B) | ✅ | ✅ |
| Transfer to Phone (B2C) | 🔜 v1.1 | ✅ |
| Payment Query | ✅ | ✅ |
| Webhook Parse | ✅ | ✅ |

---

## Going to Production

When you're ready to accept real payments:

1. **Switch `env` to `'production'`** in `createClient()`
2. **Replace sandbox credentials** with real production credentials from each portal
3. **Set up a public HTTPS callback URL** — M-Pesa and KCB can't reach `localhost`. Use a service like [ngrok](https://ngrok.com/) during development
4. **Test with real credentials** using small amounts first (KES 1)

```typescript
const pay = createClient({
  env: 'production', // ← Change this
  callbackUrl: 'https://your-real-domain.com/webhooks',
  daraja: {
    consumerKey:    process.env.LIPAD_DARAJA_CONSUMER_KEY!,    // ← Real credentials
    consumerSecret: process.env.LIPAD_DARAJA_CONSUMER_SECRET!,
    shortcode:      process.env.LIPAD_DARAJA_SHORTCODE!,
    passkey:        process.env.LIPAD_DARAJA_PASSKEY!,
  },
})
```

---

## Testing Your Webhook Locally

Use [ngrok](https://ngrok.com/) to expose your local server to the internet during development:

```bash
# Install ngrok, then:
ngrok http 3000

# Copy the HTTPS URL it gives you (e.g. https://abc123.ngrok.io)
# Set it as your LIPAD_CALLBACK_URL in .env
LIPAD_CALLBACK_URL=https://abc123.ngrok.io/webhooks
```

Then Safaricom/KCB's sandbox will be able to reach your local machine.

---

## Example with Express.js

Here's a complete payment flow in an Express app:

```typescript
import 'dotenv/config'
import express from 'express'
import { createClient, ProviderError } from 'lipad'

const app = express()
app.use(express.json())

const pay = createClient({
  env: 'sandbox',
  callbackUrl: `${process.env.BASE_URL}/webhooks`,
  daraja: {
    consumerKey:    process.env.LIPAD_DARAJA_CONSUMER_KEY!,
    consumerSecret: process.env.LIPAD_DARAJA_CONSUMER_SECRET!,
    shortcode:      process.env.LIPAD_DARAJA_SHORTCODE!,
    passkey:        process.env.LIPAD_DARAJA_PASSKEY!,
  },
})

// Route: Initiate payment
app.post('/pay', async (req, res) => {
  const { phone, amount, orderId } = req.body

  try {
    const result = await pay.daraja!.stkPush({
      phone,
      amount,
      reference: orderId,
      description: `Payment for order ${orderId}`,
    })

    res.json({
      success: true,
      transactionId: result.transactionId,
      message: 'Check your phone for the M-Pesa prompt',
    })
  } catch (err) {
    if (err instanceof ProviderError) {
      res.status(400).json({ error: err.providerMessage })
    } else {
      res.status(500).json({ error: 'Payment initiation failed' })
    }
  }
})

// Route: Handle M-Pesa webhook callback
app.post('/webhooks/daraja', (req, res) => {
  const event = pay.daraja!.webhooks.parse(req.body)

  if (event.event === 'payment.success') {
    console.log(`✓ Payment confirmed: KES ${event.amount} from ${event.phone}`)
    // TODO: Update your database, send confirmation email, fulfill order, etc.
  } else if (event.event === 'payment.failed') {
    console.log(`✗ Payment failed for reference: ${event.reference}`)
    // TODO: Notify user, release reserved stock, etc.
  }

  // Always respond 200 — Safaricom will retry if you don't
  res.sendStatus(200)
})

app.listen(3000, () => console.log('Server running on port 3000'))
```

---

## Publishing (for maintainers)

To publish a new version to npm:

```bash
# 1. Bump the version in packages/lipad-sdk/package.json
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0

# 2. Build and publish (prepublishOnly runs lint + build automatically)
cd packages/lipad-sdk
npm publish

# Or from the root if using a workspace
npm publish -w packages/lipad-sdk
```

---

## Development

```bash
# Clone the repo
git clone https://github.com/Red-misst/lipad.git
cd lipad

# Install dependencies
npm install

# Build the SDK
npm run build -w packages/lipad-sdk

# Run unit tests
npm run test:unit -w packages/lipad-sdk

# Run integration tests (requires real .env credentials)
npm run test:integration -w packages/lipad-sdk

# Type-check only (no build output)
npm run lint -w packages/lipad-sdk
```

---

## FAQ

**Q: Do I need both providers?**  
No. Configure only the providers you need. If you only pass `daraja` config, only `pay.daraja` is available. Buni won't be loaded at all.

**Q: Where do I get sandbox credentials?**  
- Daraja: [developer.safaricom.co.ke](https://developer.safaricom.co.ke/) — free account, instant access
- Buni: [developer.kcbgroup.com](https://developer.kcbgroup.com/) — free account required

**Q: Does this work with CommonJS (require)?**  
Yes. The SDK ships both ESM (`.mjs`) and CJS (`.js`) builds. It works with `import` and `require`.

**Q: What Node.js version do I need?**  
Node.js 18 or higher.

**Q: My callback URL is `localhost` — will it work?**  
No. Safaricom and KCB send webhooks from their servers to your URL. Use [ngrok](https://ngrok.com/) or [localtunnel](https://github.com/localtunnel/localtunnel) to expose your local server during development.

**Q: Why is the payment `pending` after the STK push?**  
The STK push only sends the prompt. The payment is confirmed when the user enters their PIN. Your callback URL will receive a webhook once the user completes (or cancels) the payment.

**Q: Can I use this in a serverless function (AWS Lambda, Vercel, etc.)?**  
Yes, with one caveat: authentication tokens are cached in memory. Each cold start will fetch a new token. This adds ~100–300ms on the first request per instance.

---

## License

MIT © [Isaac Muigai](https://github.com/Red-misst)
