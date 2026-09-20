# afrinex

> One SDK. Two providers. M-Pesa and KCB payments for Kenya — done right.

[![npm version](https://img.shields.io/npm/v/afrinex)](https://www.npmjs.com/package/afrinex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## What is afrinex?

If you've ever tried to integrate M-Pesa (Safaricom Daraja) or KCB (Buni) payments in a Node.js app, you know the pain:

- Each provider has a completely different API shape
- Auth flows differ (OAuth2 vs basic tokens)
- Webhooks are formatted differently per provider
- You have to write and maintain separate integration code for each one

**afrinex solves this.** It wraps both providers behind a single, consistent interface:

- **Dynamic Provider Registry**: Import and instantiate only the providers you need.
- **Unified Interface**: Same method names across providers (`stkPush`, `transfers.toPhone`, `payments.query`)
- **Same Webhook Shape**: Parse once, handle everywhere.
- **Full TypeScript Support**: Complete autocomplete and type safety.
- **AI Agent Ready**: Seamlessly plugs into `@afrinex/agent` to give your app a conversational financial assistant!

---

## Supported Providers

| Provider | Bank | What You Can Do |
|---|---|---|
| **Daraja** | Safaricom | M-Pesa STK Push (C2B), Payment Query, Webhook Parsing |
| **Buni** | KCB Bank | STK Push (C2B Express Checkout), Transfer to Phone (B2C), Payment Query, Webhook Parsing |

> **Sandbox-first design** — Both providers offer free sandbox environments. You can build and test everything without spending a shilling.

---

## Requirements

- **Node.js** v18 or higher
- A **Safaricom Developer** account (for Daraja) → [developer.safaricom.co.ke](https://developer.safaricom.co.ke/)
- A **KCB Developer** account (for Buni) → [buni.kcbgroup.com](https://buni.kcbgroup.com/)

---

## Installation

```bash
npm install afrinex
```
or
```bash
yarn add afrinex
```

---

## Getting Your Credentials

Before you can run any code, you need API credentials from each provider's developer portal. 

### Daraja (Safaricom M-Pesa)
1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke/) and create a free account
2. Click **My Apps → Create New App**
3. Select **Lipa Na M-Pesa Online** (this is STK Push)
4. After creating the app, click on it to see your `Consumer Key` and `Consumer Secret`.
5. For the **shortcode** and **passkey**, use Safaricom's sandbox test credentials:
   - Shortcode: `174379`
   - Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

### Buni (KCB Bank)
1. Go to [buni.kcbgroup.com](https://buni.kcbgroup.com/) and create a free account
2. Create a new application
3. After creating the app, you'll find your `Consumer Key` and `Consumer Secret`.
4. For the **orgShortCode**, use KCB's sandbox short code: `522522`

---

## Quickstart (5 minutes to your first STK Push)

### Step 1 — Set up environment variables

Create a `.env` file in your project root:

```bash
# Daraja (Safaricom M-Pesa)
AFRINEX_DARAJA_CONSUMER_KEY=your_consumer_key_here
AFRINEX_DARAJA_CONSUMER_SECRET=your_consumer_secret_here
AFRINEX_DARAJA_SHORTCODE=174379
AFRINEX_DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Your callback URL
AFRINEX_CALLBACK_URL=https://your-domain.com/webhooks
```

### Step 2 — Write your first integration

```typescript
import 'dotenv/config'
import { createClient, DarajaProvider } from 'afrinex'

const env = 'sandbox';

// 1. Instantiate the provider directly
const daraja = new DarajaProvider({
  consumerKey: process.env.AFRINEX_DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_DARAJA_CONSUMER_SECRET!,
  shortcode: process.env.AFRINEX_DARAJA_SHORTCODE!,
  passkey: process.env.AFRINEX_DARAJA_PASSKEY!
}, env);

// 2. Load it into the client
const pay = createClient({
  env,
  callbackUrl: process.env.AFRINEX_CALLBACK_URL,
  providers: { daraja }
});

// 3. Trigger an M-Pesa STK Push
const result = await pay.getProvider('daraja').stkPush({
  phone: '0712345678',   // Accepts 07XX, +2547XX, or 2547XX format
  amount: 1,             // Amount in KES (minimum is 1)
  reference: 'order-001' // Your internal order/invoice ID
});

console.log('Transaction ID:', result.transactionId);
```

---

## Full API Reference

### `createClient(config)`

Creates an `afrinex` client mapping out the dynamic providers you supply.

```typescript
import { createClient, DarajaProvider, BuniProvider } from 'afrinex'

const pay = createClient({
  env: 'sandbox', 
  callbackUrl: 'https://...',
  providers: {
    daraja: new DarajaProvider({ ... }, 'sandbox'),
    buni: new BuniProvider({ ... }, 'sandbox')
  }
});

// Fetch provider instance dynamically
const provider = pay.getProvider('buni');
```

---

### Shared Provider Interface (`IProvider`)

Because `afrinex` is dynamic, all registered providers implement the `IProvider` interface, meaning you can interchangeably call the following methods on either Daraja or Buni.

#### `stkPush(request)`

Sends a payment prompt directly to the customer's phone.

```typescript
const result = await provider.stkPush({
  phone: '0712345678',              
  amount: 500,                      
  reference: 'INV-2024-001',        
  description: 'Payment for order', 
});

// result: { success: true, transactionId: 'ws_CO_...', ... }
```

#### `transfers.toPhone(request)` *(Buni-only currently)*

Send money directly to a phone number (B2C — Business to Customer transfer).

```typescript
const result = await pay.getProvider('buni').transfers.toPhone({
  phone: '0722000000',
  amount: 500,
  reference: 'PAYOUT-001',
  remarks: 'Salary disbursement', 
});
```

#### `payments.query(request)`

Check the status of a payment after an STK Push. 

```typescript
const status = await provider.payments.query({
  transactionId: 'ws_CO_...', // The transactionId from stkPush result
});

// status: { status: 'success' | 'failed' | 'pending', amount: 500, ... }
```

#### `webhooks.parse(payload)`

Parse an incoming webhook notification into a unified format.

```typescript
app.post('/webhooks/:provider', (req, res) => {
  const providerName = req.params.provider;
  const event = pay.getProvider(providerName).webhooks.parse(req.body);

  console.log(event.provider)       // 'daraja' or 'buni'
  console.log(event.event)          // 'payment.success' | 'payment.failed'
  console.log(event.amount)         // Amount in KES
  console.log(event.phone)          // Normalized to 2547XXXXXXXX
  
  res.sendStatus(200);
});
```

---

## AI Agent Ecosystem

Looking to add a financial AI assistant to your app? `afrinex` is tightly integrated with its own AI agent package: `@afrinex/agent`.

The agent uses LangGraph and LangChain to autonomously stage payments, check balances, and query transactions based on natural language prompts (e.g. *"Transfer 20,000 to John"*). It also includes built-in Human-In-The-Loop (HITL) safeguards to intercept high-value transfers for human approval.

Check out the [Agent Package README](./packages/@afrinex/agent/README.md) to learn more.

---

## Error Handling

`afrinex` throws strongly-typed errors:

```typescript
import { ConfigurationError, AuthError, ProviderError, ProviderCapabilityError } from 'afrinex'

try {
  await provider.stkPush({ ... })
} catch (err) {
  if (err instanceof ProviderCapabilityError) {
    // Provider does not support this method (e.g. Daraja doesn't support transfers yet)
  } else if (err instanceof ProviderError) {
    // The API returned a rejection (e.g. invalid phone number)
  }
}
```

---

## Going to Production

When you're ready to accept real payments:

1. Switch `env` to `'production'` when instantiating the providers and client.
2. Replace sandbox credentials with real production credentials.
3. Set up a public HTTPS callback URL for webhooks.

---

## License

MIT © [Isaac Muigai](https://github.com/Red-misst)

