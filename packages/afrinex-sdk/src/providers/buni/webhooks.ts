import { normalizePhone } from '../../core/phone'
import type { UnifiedWebhookPayload } from '../../types/webhook'

interface BuniC2BPayload {
  TransactionType: string
  TransID: string
  TransAmount: number | string
  MSISDN: string
  BillRefNumber: string
  TransTime?: string
}

/**
 * Parses a raw Buni C2B callback payload into a UnifiedWebhookPayload.
 *
 * Buni only sends callbacks for successful payments — it does not call back
 * on failed transactions, so this always maps to payment.success.
 *
 * TransactionType === 'Pay Bill' → payment.success
 */
export function parse(payload: unknown): UnifiedWebhookPayload {
  const raw = payload as BuniC2BPayload

  let phone = ''
  try {
    phone = raw.MSISDN ? normalizePhone(raw.MSISDN) : ''
  } catch {
    phone = raw.MSISDN ?? ''
  }

  const completedAt = (() => {
    if (raw.TransTime === undefined) return new Date().toISOString()
    const s = raw.TransTime
    // Buni returns TransTime as YYYYMMDDHHmmss (e.g. 20240115103000)
    if (s.length === 14 && /^\d{14}$/.test(s)) {
      const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}Z`
      return new Date(iso).toISOString()
    }
    return new Date(s).toISOString()
  })()

  return {
    provider: 'buni',
    event: 'payment.success',
    transactionId: raw.TransID,
    amount: Number(raw.TransAmount),
    phone,
    reference: raw.BillRefNumber,
    completedAt,
    raw: payload,
  }
}
