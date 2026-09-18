import { normalizePhone } from '../../core/phone'
import type { UnifiedWebhookPayload, WebhookEvent } from '../../types/webhook'

interface JengaWebhookPayload {
  transactionReference: string
  amount: number
  status: string
  sourceAccountNumber?: string
  destinationAccountNumber?: string
  transactionDate?: string
}

/**
 * Parses a raw Jenga webhook payload into a UnifiedWebhookPayload.
 *
 * status === 'SUCCESS' → payment.success
 * status === 'FAILED'  → payment.failed
 * all others           → payment.pending
 */
export function parse(payload: unknown): UnifiedWebhookPayload {
  const raw = payload as JengaWebhookPayload

  let event: WebhookEvent
  if (raw.status === 'SUCCESS') {
    event = 'payment.success'
  } else if (raw.status === 'FAILED') {
    event = 'payment.failed'
  } else {
    event = 'payment.pending'
  }

  const rawPhone = raw.destinationAccountNumber ?? ''
  let phone = ''
  try {
    phone = rawPhone ? normalizePhone(rawPhone) : ''
  } catch {
    phone = rawPhone
  }

  const completedAt =
    event === 'payment.success' && raw.transactionDate !== undefined
      ? new Date(raw.transactionDate).toISOString()
      : undefined

  return {
    provider: 'jenga',
    event,
    transactionId: raw.transactionReference,
    amount: raw.amount,
    phone,
    reference: raw.transactionReference,
    ...(completedAt !== undefined ? { completedAt } : {}),
    raw: payload,
  }
}
