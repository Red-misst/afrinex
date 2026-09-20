// ── Factory ──────────────────────────────────────────────────────────────────
export { createClient } from './client'

// ── Config types ─────────────────────────────────────────────────────────────
export type {
  AfrinexConfig,
  DarajaConfig,
  BuniConfig,
} from './types/config'

export type { AfrinexClient } from './types/client'

// ── Request types ─────────────────────────────────────────────────────────────
export type {
  StkPushRequest,
  TransferToPhoneRequest,
  PaymentQueryRequest,
  BalanceRequest,
} from './types/requests'

// ── Response types ────────────────────────────────────────────────────────────
export type {
  StkPushResponse,
  TransferResponse,
  PaymentQueryResponse,
  BalanceResponse,
} from './types/responses'

// ── Webhook types ─────────────────────────────────────────────────────────────
export type { UnifiedWebhookPayload, WebhookEvent } from './types/webhook'

// ── Provider meta types ───────────────────────────────────────────────────────
export type { IProvider, Environment } from './types/provider'

// ── Providers ─────────────────────────────────────────────────────────────────
export { DarajaProvider } from './providers/daraja'
export { BuniProvider } from './providers/buni'

// ── Error classes (consumers need these for catch blocks) ─────────────────────
export { AfrinexError } from './errors/base'
export { ConfigurationError } from './errors/config-error'
export { AuthError } from './errors/auth-error'
export { ProviderError } from './errors/provider-error'
export { ProviderCapabilityError } from './errors/capability-error'

// Internal modules intentionally NOT exported:
// TokenManager, HttpClient, BaseProvider
