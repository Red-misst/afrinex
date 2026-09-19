import type { ProviderName } from './provider'

export type WebhookEvent = 'payment.success' | 'payment.failed' | 'payment.pending'

export interface UnifiedWebhookPayload {
  provider: ProviderName
  event: WebhookEvent
  transactionId: string
  amount: number
  phone: string          // always normalized to 2547XXXXXXXX
  reference: string
  completedAt?: string   // ISO 8601 — present when event is payment.success
  raw: unknown
}
