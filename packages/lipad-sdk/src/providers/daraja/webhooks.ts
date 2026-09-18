import { normalizePhone } from '../../core/phone'
import type { UnifiedWebhookPayload, WebhookEvent } from '../../types/webhook'

interface DarajaCallbackItem {
  Name: string
  Value?: string | number
}

interface DarajaStkCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: DarajaCallbackItem[]
      }
    }
  }
}

/**
 * Extracts a named value from Daraja's CallbackMetadata.Item array.
 */
function getMetadataValue(
  items: DarajaCallbackItem[],
  name: string,
): string | number | undefined {
  return items.find((i) => i.Name === name)?.Value
}

/**
 * Parses a raw Daraja STK callback payload into a UnifiedWebhookPayload.
 *
 * ResultCode === 0 → payment.success
 * All other codes → payment.failed
 *
 * transactionId is MpesaReceiptNumber if present, else CheckoutRequestID.
 */
export function parse(payload: unknown): UnifiedWebhookPayload {
  const raw = payload as DarajaStkCallback
  const callback = raw.Body.stkCallback

  const items = callback.CallbackMetadata?.Item ?? []
  const resultCode = callback.ResultCode

  const event: WebhookEvent = resultCode === 0 ? 'payment.success' : 'payment.failed'

  const receiptNumber = getMetadataValue(items, 'MpesaReceiptNumber')
  const transactionId =
    typeof receiptNumber === 'string' ? receiptNumber : callback.CheckoutRequestID

  const amount = Number(getMetadataValue(items, 'Amount') ?? 0)
  const rawPhone = getMetadataValue(items, 'PhoneNumber')
  const phone = rawPhone !== undefined ? normalizePhone(String(rawPhone)) : ''

  const transactionDate = getMetadataValue(items, 'TransactionDate')
  const completedAt = (() => {
    if (event !== 'payment.success' || transactionDate === undefined) return undefined
    // Daraja returns TransactionDate as YYYYMMDDHHmmss (e.g. 20191219102115)
    const s = String(transactionDate)
    if (s.length === 14) {
      const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}Z`
      return new Date(iso).toISOString()
    }
    return new Date(s).toISOString()
  })()

  return {
    provider: 'daraja',
    event,
    transactionId,
    amount,
    phone,
    reference: callback.MerchantRequestID,
    ...(completedAt !== undefined ? { completedAt } : {}),
    raw: payload,
  }
}
