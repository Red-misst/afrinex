// ── Factory ──────────────────────────────────────────────────────────────────
export { createClient } from './client'

// ── Config types ─────────────────────────────────────────────────────────────
export type {
  LipadConfig,
  DarajaConfig,
  BuniConfig,
} from './types/config'

export type { LipadClient } from './types/client'

// ── Request types ─────────────────────────────────────────────────────────────
export type {
  StkPushRequest,
  TransferToPhoneRequest,
  PaymentQueryRequest,
} from './types/requests'

// ── Response types ────────────────────────────────────────────────────────────
export type {
  StkPushResponse,
  TransferResponse,
  PaymentQueryResponse,
} from './types/responses'

// ── Webhook types ─────────────────────────────────────────────────────────────
export type { UnifiedWebhookPayload, WebhookEvent } from './types/webhook'

// ── Provider meta types ───────────────────────────────────────────────────────
export type { ProviderName, Environment } from './types/provider'

// ── Error classes (consumers need these for catch blocks) ─────────────────────
export { LipadError } from './errors/base'
export { ConfigurationError } from './errors/config-error'
export { AuthError } from './errors/auth-error'
export { ProviderError } from './errors/provider-error'
export { ProviderCapabilityError } from './errors/capability-error'

// Internal modules intentionally NOT exported:
// TokenManager, HttpClient, BaseProvider
