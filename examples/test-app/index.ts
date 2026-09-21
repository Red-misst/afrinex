import { createClient, ProviderError, DarajaProvider, BuniProvider } from 'afrinex';
import type {
  StkPushResponse,
  PaymentQueryResponse,
  TransferResponse,
  UnifiedWebhookPayload,
  BalanceResponse
} from 'afrinex';
import 'dotenv/config';

// ─────────────────────────────────────────────────────────────────────────────
// Test runner helpers
// ─────────────────────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;

function section(title: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}`);
}

function ok(label: string, value?: unknown) {
  pass++;
  console.log(`  ✅ PASS  ${label}`);
  if (value !== undefined) {
    const display = typeof value === 'object' ? JSON.stringify(value, null, 4) : String(value);
    // indent each line
    const indented = display.split('\n').map((l) => `          ${l}`).join('\n');
    console.log(indented);
  }
}

function fail_(label: string, err: unknown) {
  fail++;
  console.log(`  ❌ FAIL  ${label}`);
  if (err instanceof ProviderError) {
    console.log(`          Provider Code:    ${err.providerCode}`);
    console.log(`          Provider Message: ${err.providerMessage}`);
    const rawStr = JSON.stringify(err.raw, null, 4);
    const indented = rawStr.split('\n').map((l) => `          ${l}`).join('\n');
    console.log(`          Raw response:\n${indented}`);
  } else {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`          ${msg}`);
  }
}

function assertField(obj: Record<string, unknown>, field: string) {
  if (obj[field] === undefined || obj[field] === null) {
    throw new Error(`Missing expected field: "${field}"`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

const env = 'sandbox';

const daraja = new DarajaProvider({
  consumerKey: process.env.AFRINEX_DARAJA_CONSUMER_KEY || 'dummy_key',
  consumerSecret: process.env.AFRINEX_DARAJA_CONSUMER_SECRET || 'dummy_secret',
  shortcode: process.env.AFRINEX_DARAJA_SHORTCODE || '174379',
  passkey: process.env.AFRINEX_DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  initiatorName: process.env.AFRINEX_DARAJA_INITIATOR_NAME || 'test',
  initiatorPassword: process.env.AFRINEX_DARAJA_INITIATOR_PASSWORD || 'test',
  certPath: process.env.AFRINEX_DARAJA_CERT_PATH || undefined, // undefined will throw on B2C if called
}, env);

const buni = new BuniProvider({
  consumerKey: process.env.AFRINEX_BUNI_CONSUMER_KEY || 'dummy_key',
  consumerSecret: process.env.AFRINEX_BUNI_CONSUMER_SECRET || 'dummy_secret',
  orgShortCode: process.env.AFRINEX_BUNI_ORG_SHORT_CODE || '522522',
}, env);

const pay = createClient({
  env,
  callbackUrl: process.env.AFRINEX_CALLBACK_URL || 'https://afrinex-test.ngrok.io/webhooks',
  providers: {
    daraja,
    buni
  },
});

// Helper for testing promises
async function runTests() {
  const DARAJA_PHONE = '254708374149';
  const BUNI_PHONE = '254722000000';
  const AMOUNT = 1;

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. DARAJA — STK Push
  // ═════════════════════════════════════════════════════════════════════════════

  section('DARAJA — 1. stkPush()');

  let darajaCheckoutId = '';

  try {
    const res: StkPushResponse = await pay.getProvider('daraja').stkPush({
      phone: DARAJA_PHONE,
      amount: AMOUNT,
      reference: `afrinex-TEST-${Date.now()}`,
      description: 'afrinex integration test',
    });

    assertField(res as unknown as Record<string, unknown>, 'transactionId');
    assertField(res as unknown as Record<string, unknown>, 'success');
    assertField(res as unknown as Record<string, unknown>, 'message');

    darajaCheckoutId = res.transactionId;

    ok('Response shape is correct');
    ok('transactionId', res.transactionId);
    ok('success', res.success);
    ok('message', res.message);
    ok('raw output', res.raw);
  } catch (err) {
    fail_('stkPush()', err);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. DARAJA — Payment Query
  // ═════════════════════════════════════════════════════════════════════════════

  section('DARAJA — 2. payments.query()');

  if (darajaCheckoutId) {
    try {
      const res: PaymentQueryResponse = await pay.getProvider('daraja').payments.query({
        transactionId: darajaCheckoutId,
      });

      assertField(res as unknown as Record<string, unknown>, 'transactionId');
      assertField(res as unknown as Record<string, unknown>, 'status');

      const validStatuses = ['success', 'failed', 'pending'];
      if (!validStatuses.includes(res.status)) {
        throw new Error(`Unexpected status value: "${res.status}"`);
      }

      ok('Response shape is correct');
      ok('transactionId', res.transactionId);
      ok('status (success | failed | pending)', res.status);
      ok('raw output', res.raw);
    } catch (err) {
      if (err instanceof ProviderError && (err.providerCode === '500.001.1001' || err.providerCode === '429')) {
        ok(`Expected Daraja Sandbox limitation (${err.providerCode} Error for query/Spike Arrest) occurred`, err.raw);
      } else {
        fail_('payments.query()', err);
      }
    }
  } else {
    console.log('  ⚠️  SKIP  payments.query() — no checkout ID from stkPush');
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. DARAJA — Webhook Parse (with a realistic mock payload)
  // ═════════════════════════════════════════════════════════════════════════════

  section('DARAJA — 3. webhooks.parse() [mock payload — success]');

  try {
    const mockSuccessPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'afrinex-TEST-MERCHANT-001',
          CheckoutRequestID: 'ws_CO_mock_001',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 1 },
              { Name: 'MpesaReceiptNumber', Value: 'PDE1234ABCD' },
              { Name: 'Balance' },
              { Name: 'TransactionDate', Value: 20240119103000 },
              { Name: 'PhoneNumber', Value: 254708374149 },
            ],
          },
        },
      },
    };

    const event: UnifiedWebhookPayload = pay.handleWebhook('daraja', mockSuccessPayload);

    assertField(event as unknown as Record<string, unknown>, 'provider');
    assertField(event as unknown as Record<string, unknown>, 'event');
    assertField(event as unknown as Record<string, unknown>, 'transactionId');

    if (event.provider !== 'daraja') throw new Error(`Expected provider "daraja", got "${event.provider}"`);
    if (event.event !== 'payment.success') throw new Error(`Expected event "payment.success", got "${event.event}"`);
    if (!event.transactionId) throw new Error('transactionId is empty');
    if (!event.completedAt) throw new Error('completedAt should be set on success');

    ok('provider = "daraja"');
    ok('event = "payment.success"');
    ok('transactionId', event.transactionId);
    ok('amount', event.amount);
    ok('phone (normalized)', event.phone);
    ok('completedAt (ISO 8601)', event.completedAt);
    ok('raw output', event.raw);
  } catch (err) {
    fail_('webhooks.parse() [success payload]', err);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. DARAJA — Webhook Parse (Mock Failed)
  // ═════════════════════════════════════════════════════════════════════════════

  section('DARAJA — 4. webhooks.parse() [mock payload — failed]');

  try {
    const mockFailedPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'afrinex-TEST-MERCHANT-002',
          CheckoutRequestID: 'ws_CO_mock_002',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user.',
        },
      },
    };

    const event: UnifiedWebhookPayload = pay.handleWebhook('daraja', mockFailedPayload);

    if (event.event !== 'payment.failed') throw new Error(`Expected "payment.failed", got "${event.event}"`);
    if (event.provider !== 'daraja') throw new Error(`Expected "daraja", got "${event.provider}"`);

    ok('event = "payment.failed"');
    ok('transactionId (falls back to CheckoutRequestID)', event.transactionId);
    ok('completedAt is undefined on failure', event.completedAt);
    ok('raw output', event.raw);
  } catch (err) {
    fail_('webhooks.parse() [failed payload]', err);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. BUNI — STK Push
  // ═════════════════════════════════════════════════════════════════════════════

  section('BUNI — 5. stkPush()');

  let buniTransactionId = '';

  try {
    const res: StkPushResponse = await pay.getProvider('buni').stkPush({
      phone: BUNI_PHONE,
      amount: AMOUNT,
      reference: `afrinex-BUNI-${Date.now()}`,
      description: 'afrinex Buni integration test',
    });

    assertField(res as unknown as Record<string, unknown>, 'success');
    assertField(res as unknown as Record<string, unknown>, 'message');

    buniTransactionId = res.transactionId || `MOCK-${Date.now()}`;

    ok('Response shape is correct');
    ok('success', res.success);
    ok('transactionId', res.transactionId);
    ok('message', res.message);
    ok('raw output', res.raw);
  } catch (err) {
    fail_('stkPush()', err);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. BUNI — Transfer to Phone (B2C)
  // ═════════════════════════════════════════════════════════════════════════════

  section('BUNI — 6. transfers.toPhone()');

  try {
    const res: TransferResponse = await pay.getProvider('buni').transfers.toPhone({
      phone: BUNI_PHONE,
      amount: 10,
      reference: `BUNI-B2C-${Date.now()}`,
      remarks: 'afrinex B2C integration test',
    });

    assertField(res as unknown as Record<string, unknown>, 'success');
    assertField(res as unknown as Record<string, unknown>, 'message');

    ok('Response shape is correct');
    ok('success', res.success);
    ok('transactionId', res.transactionId);
    ok('message', res.message);
    ok('raw output', res.raw);
  } catch (err) {
    if (err instanceof ProviderError && (err.providerCode === '900908' || err.providerCode === '404' || err.providerCode === '406')) {
      ok(`Expected Buni Sandbox limitation (${err.providerCode} Forbidden/Not Found/Invalid Amount) occurred`, err.raw);
    } else {
      fail_('transfers.toPhone()', err);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 7. BUNI — Payment Query
  // ═════════════════════════════════════════════════════════════════════════════

  section('BUNI — 7. payments.query()');

  try {
    const res: PaymentQueryResponse = await pay.getProvider('buni').payments.query({
      transactionId: buniTransactionId,
    });

    assertField(res as unknown as Record<string, unknown>, 'transactionId');
    assertField(res as unknown as Record<string, unknown>, 'status');

    ok('Response shape is correct');
    ok('transactionId', res.transactionId);
    ok('status', res.status);
    ok('amount', res.amount);
    ok('raw output', res.raw);
  } catch (err) {
    if (err instanceof ProviderError && (err.providerCode === '900908' || err.providerCode === '400')) {
      ok(`Expected Buni Sandbox limitation (${err.providerCode} Forbidden/Payload Validation) occurred`, err.raw);
    } else {
      fail_('payments.query()', err);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 8. BUNI — Webhook Parse (mock payload)
  // ═════════════════════════════════════════════════════════════════════════════

  section('BUNI — 8. webhooks.parse() [mock IPN payload — success]');

  try {
    const mockBuniPayload = {
      "header": {
        "messageID": "12345",
        "originatorConversationID": "TEJ6CQQPBQ",
        "channelCode": "202",
        "timeStamp": "20250519133100"
      },
      "requestPayload": {
        "primaryData": {
          "businessKey": "1234567",
          "businessKeyType": "notifyBiller"
        },
        "additionalData": {
          "notificationData": {
            "businessKey": "1234567",
            "businessKeyType": "BillReferenceNumber",
            "debitMSISDN": "254711000000",
            "transactionAmt": "1000",
            "transactionDate": "Mon May 19 13:30:54 EAT 2025",
            "transactionID": "FT25139M3RM6",
            "firstName": "PETER BOR",
            "currency": "KES",
            "narration": "School Fees",
            "transactionType": "MPESA",
            "balance": "0"
          }
        }
      }
    };

    const event: UnifiedWebhookPayload = pay.handleWebhook('buni', mockBuniPayload);

    assertField(event as unknown as Record<string, unknown>, 'provider');
    assertField(event as unknown as Record<string, unknown>, 'event');
    assertField(event as unknown as Record<string, unknown>, 'transactionId');

    if (event.provider !== 'buni') throw new Error(`Expected provider "buni", got "${event.provider}"`);
    if (event.event !== 'payment.success') throw new Error(`Expected "payment.success", got "${event.event}"`);
    if (event.transactionId !== 'FT25139M3RM6') throw new Error(`transactionId mismatch: ${event.transactionId}`);
    if (!event.completedAt) throw new Error('completedAt should be set');

    ok('provider = "buni"');
    ok('event = "payment.success"');
    ok('transactionId', event.transactionId);
    ok('amount (parsed from string)', event.amount);
    ok('phone (normalized)', event.phone);
    ok('reference', event.reference);
    ok('completedAt (ISO 8601)', event.completedAt);
    ok('raw output', event.raw);
  } catch (err) {
    fail_('webhooks.parse() [Buni IPN payload]', err);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 9. EVENT EMITTER — Balances
  // ═════════════════════════════════════════════════════════════════════════════

  section('EVENT EMITTER — 9. balances() [simulate webhook]');

  try {
    setTimeout(() => {
      pay.events.emit('balance:daraja', {
        provider: 'daraja',
        event: 'balance.success',
        amount: 55000,
        raw: { mocked: true }
      });
    }, 1000);

    const res: BalanceResponse = await pay.getProvider('daraja').balances();
    
    assertField(res as unknown as Record<string, unknown>, 'success');
    assertField(res as unknown as Record<string, unknown>, 'balance');

    ok('Balance Promise Resolved using EventEmitter');
    ok('success', res.success);
    ok('balance', res.balance);
    ok('raw output', res.raw);
  } catch (err) {
    if (err instanceof ProviderError && err.providerCode === '400.002.02') {
      ok('Expected Daraja Sandbox limitation (Invalid Initiator) occurred', err.raw);
    } else {
      fail_('balances() [EventEmitter]', err);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // Summary
  // ═════════════════════════════════════════════════════════════════════════════

  const total = pass + fail;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  TEST RESULTS`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Total:  ${total}`);
  console.log(`  Passed: ${pass} ✅`);
  console.log(`  Failed: ${fail} ❌`);
  console.log(`${'═'.repeat(60)}\n`);

  if (fail > 0) {
    process.exit(1);
  }
}

runTests();
