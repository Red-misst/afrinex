# Afrinex SDK

> A unified, dynamic payments SDK for Kenya — Standardizing M-Pesa (Daraja) and KCB (Buni) behind a single interface.

[![npm version](https://img.shields.io/npm/v/afrinex)](https://www.npmjs.com/package/afrinex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 The Idea Behind Afrinex

Integrating multiple payment gateways in Kenya is historically a fragmented, painful experience. Safaricom's Daraja API and KCB's Buni API have completely different shapes:
- **Authentication**: Daraja uses Basic Auth to get a temporary OAuth token. Buni uses standard OAuth2.
- **Payloads**: The JSON structure for an STK push is completely different.
- **Webhooks**: Parsing a successful payment from Daraja is a nested nightmare compared to Buni's flatter structure.
- **Error Handling**: Each returns errors in a proprietary format.

**Afrinex** was built to solve this fragmentation. The core philosophy is **Unification through Abstraction**. Afrinex provides a single, consistent `IProvider` interface that all payment gateways must implement. This means:
- You learn one API (`stkPush`, `payments.query`, `webhooks.parse`).
- You handle one standard set of strongly-typed errors.
- You can dynamically load only the providers you need (reducing bundle size and mental overhead).

---

## 🏗️ Core Architecture

Afrinex is built around a flexible, plugin-like architecture:

1. **`AfrinexClient`**: The central orchestrator. It holds a registry of your instantiated providers and manages global configuration (like your `callbackUrl` and `env`).
2. **Providers (`DarajaProvider`, `BuniProvider`)**: Independent classes that implement the `IProvider` interface. They handle the underlying HTTP requests, token caching (using an in-memory mutex to prevent race conditions during token refresh), and payload normalization.
3. **Unified DTOs (Data Transfer Objects)**: Standardized request and response objects. When you call `stkPush`, you pass a generic `StkPushRequest` object. The provider translates this into the specific payload expected by Daraja or Buni.

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
- **Daraja (Safaricom M-Pesa)**: Create an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke/). You will need a `Consumer Key` and `Consumer Secret`.
- **Buni (KCB Bank)**: Create an app at [buni.kcbgroup.com](https://buni.kcbgroup.com/). You will need a `Consumer Key` and `Consumer Secret`.

Setup your environment variables (e.g., in a `.env` file):

```env
# Daraja
AFRINEX_DARAJA_CONSUMER_KEY=your_key
AFRINEX_DARAJA_CONSUMER_SECRET=your_secret
AFRINEX_DARAJA_SHORTCODE=174379
AFRINEX_DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Buni
AFRINEX_BUNI_CONSUMER_KEY=your_key
AFRINEX_BUNI_CONSUMER_SECRET=your_secret
AFRINEX_BUNI_ORG_SHORT_CODE=522522

# Global
AFRINEX_CALLBACK_URL=https://api.yourdomain.com/webhooks
```

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
  passkey: process.env.AFRINEX_DARAJA_PASSKEY!
}, env);

const buni = new BuniProvider({
  consumerKey: process.env.AFRINEX_BUNI_CONSUMER_KEY!,
  consumerSecret: process.env.AFRINEX_BUNI_CONSUMER_SECRET!,
  orgShortCode: process.env.AFRINEX_BUNI_ORG_SHORT_CODE!
}, env);

// 2. Create the Client
const afrinex = createClient({
  env,
  callbackUrl: process.env.AFRINEX_CALLBACK_URL,
  providers: {
    daraja,
    buni
  }
});
```

### 4. Executing Transactions

To trigger an M-Pesa STK Push (C2B Express Checkout), grab the provider from the client and call `stkPush`.

```typescript
async function chargeCustomer() {
  const provider = afrinex.getProvider('daraja'); // or 'buni'
  
  try {
    const result = await provider.stkPush({
      phone: '0712345678',       // Formats accepted: 07XX, 2547XX, +2547XX
      amount: 1,                 // Amount in KES
      reference: 'INV-001',      // Your internal reference
      description: 'Payment'     // Optional description
    });
    
    console.log('Transaction Initiated:', result.transactionId);
  } catch (error) {
    console.error('Failed to initiate transaction:', error);
  }
}
```

### 5. Handling Webhooks

Both Daraja and Buni will send HTTP POST requests to your `callbackUrl` asynchronously. Afrinex provides a `.webhooks.parse()` method that normalizes the incoming JSON into a standard `AfrinexWebhookEvent`.

```typescript
// Example using Express.js
app.post('/webhooks/:providerName', (req, res) => {
  const { providerName } = req.params;
  const provider = afrinex.getProvider(providerName);
  
  try {
    // This handles both Daraja's complex nesting and Buni's format!
    const event = provider.webhooks.parse(req.body);
    
    if (event.event === 'payment.success') {
      console.log(`Received ${event.amount} from ${event.phone}`);
      console.log(`Provider reference: ${event.providerReference}`); // E.g., the M-Pesa receipt number
      
      // Update your database here...
    } else {
      console.log('Payment failed or cancelled.');
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook parsing failed:', error);
    res.sendStatus(400);
  }
});
```

---

## 📚 Comprehensive API Reference

### `IProvider` Interface
All providers guarantee these methods:

- `stkPush(request: StkPushRequest): Promise<StkPushResponse>`
  Initiates a mobile money prompt on the user's phone.
- `payments.query(request: PaymentQueryRequest): Promise<PaymentQueryResponse>`
  Checks the status of an initiated STK push.
- `transfers.toPhone(request: TransferToPhoneRequest): Promise<TransferResponse>`
  Sends money from your paybill to a user's phone (B2C). *Note: May throw `ProviderCapabilityError` if the provider doesn't support it.*
- `webhooks.parse(payload: any): AfrinexWebhookEvent`
  Normalizes a raw webhook JSON payload.

### Error Handling
Afrinex exports custom Error classes for precise error handling:
- `AfrinexError`: Base class for all SDK errors.
- `ConfigurationError`: Thrown during initialization if credentials are missing or invalid.
- `AuthError`: Thrown if token generation fails (e.g., invalid consumer key).
- `ProviderError`: Thrown if the upstream provider rejects the request (e.g., invalid phone number).
- `ProviderCapabilityError`: Thrown if you call a method not supported by the provider (e.g., calling `transfers.toPhone` on a provider that only supports C2B).

```typescript
import { ProviderError, AuthError } from 'afrinex';

try {
  // ... call provider
} catch (error) {
  if (error instanceof ProviderError) {
    console.error(`Upstream rejected: ${error.message} (Code: ${error.code})`);
  } else if (error instanceof AuthError) {
    console.error('Check your API keys!');
  }
}
```

---

## 🛠️ Guide for Contributors & Forking

Want to fork Afrinex to add a new bank, mobile money provider (like Airtel Money), or customize the internal logic? Here is everything you need to know.

### Project Structure
```
packages/afrinex-sdk/
├── src/
│   ├── core/         # The AfrinexClient and BaseProvider abstract class
│   ├── errors/       # Custom error classes
│   ├── providers/    # Individual provider implementations (daraja.ts, buni.ts)
│   ├── types/        # TypeScript interfaces and unified DTOs
│   └── index.ts      # Main export barrel
├── tests/
│   ├── unit/         # Vitest unit tests (mocked HTTP)
│   └── integration/  # Vitest integration tests (real Sandbox HTTP calls)
```

### How to Add a New Provider

If you are forking to add a new provider (e.g., `AirtelProvider`):

1. **Create the file**: Create `src/providers/airtel.ts`.
2. **Extend the Base**: Your class should extend the abstract `BaseProvider` class. `BaseProvider` handles the token caching and mutex locking for you.
3. **Implement Abstract Methods**: 
   - `protected abstract generateToken(): Promise<string>`
   - `stkPush(request: StkPushRequest): Promise<StkPushResponse>`
   - `webhooks.parse(payload: any): AfrinexWebhookEvent`
   - ...and others from `IProvider`.
4. **Use Unified Types**: Map the incoming generic `StkPushRequest` to Airtel's specific JSON structure. Map Airtel's response back to the generic `StkPushResponse`.
5. **Export it**: Add it to `src/index.ts`.

Example skeleton:
```typescript
import { BaseProvider } from '../core/base-provider';
import { IProvider, StkPushRequest, StkPushResponse } from '../types';

export class AirtelProvider extends BaseProvider implements IProvider {
  constructor(config: AirtelConfig, env: 'sandbox' | 'production') {
    super(env, 'https://sandbox.airtel.com', 'https://api.airtel.com');
  }

  protected async generateToken(): Promise<string> {
    // Implement Airtel's OAuth flow
    // Return the bare token string
  }

  async stkPush(request: StkPushRequest): Promise<StkPushResponse> {
    const token = await this.getToken(); // Automatically handles caching!
    
    // Map request to Airtel format
    // Make Axios request with token
    // Map response to StkPushResponse
  }
  
  // ... implement other methods
}
```

### Development Scripts

- `npm run build`: Compiles TS using `tsup` into ESM and CJS formats in the `dist/` folder.
- `npm run test`: Runs the Vitest test suite.
- `npm run lint`: Runs `tsc` to check for type errors.

### Testing Strategy
We use `vitest`.
- **Unit Tests (`tests/unit`)**: Use mocking (e.g., mocking `axios`) to test internal logic, error handling, and webhook parsing without hitting network.
- **Integration Tests (`tests/integration`)**: These hit the actual sandbox APIs. You must have a `.env` file populated with sandbox keys to run these successfully.

---

## 📜 License

MIT © [Isaac Muigai](https://github.com/Red-misst)
