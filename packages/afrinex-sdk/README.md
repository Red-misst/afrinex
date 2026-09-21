# Afrinex SDK

> A unified, dynamic payments SDK for Kenya — Standardizing M-Pesa (Daraja) and KCB (Buni) behind a single interface.

[![npm version](https://img.shields.io/npm/v/afrinex)](https://www.npmjs.com/package/afrinex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> ⭐️ **Love Afrinex? Please consider giving it a star on GitHub!** ⭐️
> It helps the project grow, reach more developers in the ecosystem, and keeps the open-source maintenance going.

---

## 📖 The Idea Behind Afrinex

Integrating multiple payment gateways in Kenya is historically a fragmented, painful experience. Safaricom's Daraja API and KCB's Buni API have completely different shapes:
- **Authentication**: Daraja uses Basic Auth to get a temporary OAuth token. Buni uses standard OAuth2.
- **Payloads**: The JSON structure for an STK push is completely different.
- **Webhooks**: Parsing a successful payment from Daraja is a nested nightmare compared to Buni's flatter structure.
- **Error Handling**: Each returns errors in a proprietary format.

**Afrinex** was built to solve this fragmentation. The core philosophy is **Unification through Abstraction**. Afrinex provides a single, consistent interface that all payment gateways must implement. This means:
- You learn one API (`stkPush`, `payments.query`, `transfers.toPhone`).
- You handle one standard set of strongly-typed webhook payloads via `handleWebhook`.
- You can dynamically load only the providers you need (reducing bundle size and mental overhead).

---

## 🏗️ Core Architecture

Afrinex is built around a flexible, plugin-like architecture:

1. **`AfrinexClient`**: The central orchestrator created via `createClient`. It holds a registry of your instantiated providers, manages global configuration (like your `callbackUrl` and `env`), routes webhooks, and manages an internal event emitter.
2. **Providers (`DarajaProvider`, `BuniProvider`)**: Independent classes that implement the underlying provider interfaces. They handle the underlying HTTP requests, token caching, and payload normalization.
3. **Unified DTOs (Data Transfer Objects)**: Standardized request and response objects. When you call `stkPush`, you pass a generic request object. The provider translates this into the specific payload expected by Daraja or Buni.

---

## 🚀 Step-by-Step Integration Guide

### 1. Installation

```bash
npm install afrinex
# or
yarn add afrinex
# or
pnpm add afrinex
```

### 2. Procure Credentials

You need API credentials from the respective developer portals:
- **Daraja (Safaricom M-Pesa)**: Create an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke/). You will need a `Consumer Key`, `Consumer Secret`, `Shortcode`, `Passkey`, `Initiator Name`, and `Initiator Password`.
- **Buni (KCB Bank)**: Create an app at [buni.kcbgroup.com](https://buni.kcbgroup.com/). You will need a `Consumer Key`, `Consumer Secret`, and `Org Short Code`.

### 3. Initialization

Instantiate the specific providers you need, then register them with the `createClient` factory.

```typescript
import { createClient, DarajaProvider, BuniProvider } from 'afrinex';
import 'dotenv/config';

const env = 'sandbox'; // switch to 'production' when live

// 1. Initialize Providers
const daraja = new DarajaProvider({
  consumerKey: process.env.AFRINEX_DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_DARAJA_CONSUMER_SECRET!,
  shortcode: process.env.AFRINEX_DARAJA_SHORTCODE!,
  passkey: process.env.AFRINEX_DARAJA_PASSKEY!,
  initiatorName: process.env.AFRINEX_DARAJA_INITIATOR_NAME!,
  initiatorPassword: process.env.AFRINEX_DARAJA_INITIATOR_PASSWORD!,
  // certPath: 'path/to/cert.cer' // Required for Daraja B2C/Balances in production
}, env);

const buni = new BuniProvider({
  consumerKey: process.env.AFRINEX_BUNI_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_BUNI_CONSUMER_SECRET!,
  orgShortCode: process.env.AFRINEX_BUNI_ORG_SHORT_CODE!
}, env);

// 2. Create the Client
const pay = createClient({
  env,
  callbackUrl: process.env.AFRINEX_CALLBACK_URL || 'https://api.yourdomain.com/webhooks',
  providers: {
    daraja,
    buni
  }
});
```

### 4. Executing Transactions

With the `pay` client initialized, you can retrieve a provider by name and execute standard commands seamlessly.

#### STK Push (C2B Express Checkout)
```typescript
// For Daraja (M-Pesa)
const darajaRes = await pay.getProvider('daraja').stkPush({
  phone: '254708374149',
  amount: 1,
  reference: `INV-DARAJA-${Date.now()}`,
  description: 'Payment for services'
});
console.log('Daraja Checkout ID:', darajaRes.transactionId);

// For Buni (KCB)
const buniRes = await pay.getProvider('buni').stkPush({
  phone: '254722000000',
  amount: 1,
  reference: `INV-BUNI-${Date.now()}`,
  description: 'Payment for services'
});
console.log('Buni Checkout ID:', buniRes.transactionId);
```

#### B2C Transfers (Sending money to a phone)
```typescript
const transferRes = await pay.getProvider('buni').transfers.toPhone({
  phone: '254722000000',
  amount: 100,
  reference: `B2C-${Date.now()}`,
  remarks: 'Salary Payment'
});
```

#### Querying Transaction Status
```typescript
const queryRes = await pay.getProvider('buni').payments.query({
  transactionId: buniRes.transactionId
});
console.log('Payment Status:', queryRes.status);
```

### 5. Handling Webhooks & Event Emitters

Both Daraja and Buni send asynchronous HTTP POST callbacks to your `callbackUrl`. Afrinex simplifies this by exposing a single `handleWebhook` method on the client that parses the incoming payload into a standard `UnifiedWebhookPayload`.

```typescript
// Example using Express.js
app.post('/webhooks/:provider', (req, res) => {
  const providerName = req.params.provider as 'daraja' | 'buni';
  
  try {
    // Automatically parse Daraja/Buni specific payloads into a unified format
    const event = pay.handleWebhook(providerName, req.body);
    
    if (event.event === 'payment.success') {
      console.log(`Received ${event.amount} from ${event.phone}`);
      console.log(`Transaction ID: ${event.transactionId}`);
      // Mark invoice as paid in your DB...
    } else {
      console.log(`Payment failed: ${event.transactionId}`);
    }

    // You can optionally emit internal events to resolve pending promises (like balances)
    pay.events.emit(`${event.event}:${providerName}`, event);
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.sendStatus(400);
  }
});
```

---

## 🚧 Sandbox Limitations & Troubleshooting

When developing in the Daraja and Buni Sandbox environments, you will inevitably encounter intentional limitations that do not apply to production. Here are the most common sandbox errors and how to resolve them:

### Buni: `Account not whitelisted for FT API` (Code 406 / 900908)
When calling `transfers.toPhone()` in the Buni Sandbox, you might receive an error stating `Validation failed: Account not whitelisted for FT API` or an `Invalid Amount / Not Found` error.
- **Why this happens:** The Buni Sandbox strictly governs access to the Funds Transfer (FT/B2C) API. By default, newly created sandbox apps are not whitelisted to execute transfers.
- **The Fix:** You must email KCB Support at **buni@kcbgroup.com**. Provide your Buni Developer Username and App Name, and explicitly request to be "whitelisted for the FT API in the sandbox environment."

### Buni: `Internal Server Error` (Status 500) on Payments Query
When querying STK transactions using `payments.query()`, the Buni Sandbox Vending Gateway may successfully accept the payload format but ultimately crash downstream with a `500 Internal Server Error`.
- **Why this happens:** This is a known instability/limitation in the KCB Buni sandbox environment when checking the status of mock STK push transactions. Afrinex formats the payload correctly (`{ payload: { requestId: ... } }`), but the backend sandbox database occasionally fails to resolve it.

### Daraja: `Bad Request - Invalid Initiator` (Code 400.002.02)
When calling `balances()` or B2C endpoints in the Daraja Sandbox, you might see this error.
- **Why this happens:** You are either missing the Daraja security certificate (`cert.cer`), or the sandbox `Initiator Name` and `Initiator Password` provided do not match the sandbox defaults. Ensure you have properly generated the security credentials using the official Daraja sandbox public certificate.

### Daraja: Spike Arrest / Too Many Requests (Code 500.001.1001 / 429)
When aggressively testing Daraja APIs (especially `payments.query()`), the sandbox API Gateway will block you with a Spike Arrest error.
- **Why this happens:** The Daraja Sandbox limits the number of requests per second per IP/Account to simulate rate limiting.
- **The Fix:** Implement delays/retries in your testing script, or simply wait a few seconds between requests.

---

## 📚 Error Handling

Afrinex exports custom Error classes for precise error handling:
- `AfrinexError`: Base class for all SDK errors.
- `ConfigurationError`: Thrown during initialization if credentials are missing or invalid.
- `AuthError`: Thrown if token generation fails (e.g., invalid consumer key).
- `ProviderError`: Thrown if the upstream provider rejects the request. It includes the original `providerCode` and `providerMessage`.

```typescript
import { ProviderError } from 'afrinex';

try {
  await pay.getProvider('buni').transfers.toPhone({ ... });
} catch (error) {
  if (error instanceof ProviderError) {
    console.error(`Upstream rejected: ${error.providerMessage} (Code: ${error.providerCode})`);
    console.error('Raw response:', error.raw);
  }
}
```

---

## 🛠️ Guide for Contributors & Forking

Want to fork Afrinex to add a new provider?

### Project Structure
```text
packages/afrinex-sdk/
├── src/
│   ├── core/         # The AfrinexClient, EventEmitter, TokenManager, and HttpClient
│   ├── errors/       # Custom error classes
│   ├── providers/    # Individual provider implementations (daraja, buni)
│   ├── types/        # TypeScript interfaces and unified DTOs
│   └── index.ts      # Main export barrel
├── tests/            # Test suite
```

### Development Scripts
- `yarn build`: Compiles TS using `tsup` into ESM and CJS formats in the `dist/` folder.
- `yarn test` (in test-app): Runs the integration tests.

---

## 📜 License

MIT © [Isaac Muigai](https://github.com/Red-misst)
