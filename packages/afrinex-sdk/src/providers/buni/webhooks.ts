import { normalizePhone } from '../../core/phone'
import type { UnifiedWebhookPayload } from '../../types/webhook'

interface BuniTillPayload {
  requestPayload?: {
    additionalData?: {
      notificationData?: {
        transactionID?: string
        transactionAmt?: string
        debitMSISDN?: string
        businessKey?: string
        transactionDate?: string
      }
    }
  }
}

interface BuniAccountPayload {
  transactionReference?: string
  transactionAmount?: string
  customerMobileNumber?: string
  timestamp?: string
  customerReference?: string
}

/**
 * Parses a raw Buni callback payload into a UnifiedWebhookPayload.
 * Handles both Till Instant Payment Notifications and Account Instant Payment Notifications.
 *
 * Buni only sends callbacks for successful payments — it does not call back
 * on failed transactions, so this always maps to payment.success.
 */
export function parse(payload: unknown): UnifiedWebhookPayload {
  const rawTill = payload as BuniTillPayload
  const rawAcc = payload as BuniAccountPayload

  const notification = rawTill?.requestPayload?.additionalData?.notificationData

  // Extract fields depending on payload type (Till vs Account notification)
  const transactionId = notification?.transactionID ?? rawAcc.transactionReference ?? ''
  const amountStr = notification?.transactionAmt ?? rawAcc.transactionAmount ?? '0'
  const rawPhone = notification?.debitMSISDN ?? rawAcc.customerMobileNumber ?? ''
  const reference = notification?.businessKey ?? rawAcc.customerReference ?? ''
  const rawTime = notification?.transactionDate ?? rawAcc.timestamp

  let phone = ''
  try {
    phone = rawPhone ? normalizePhone(rawPhone) : ''
  } catch {
    phone = rawPhone
  }

  const completedAt = (() => {
    if (!rawTime) return new Date().toISOString()
    
    // Check if it's the YYYYMMDDHHmm format used in account notifications (e.g. 202111110305)
    if (/^\d{12}$/.test(rawTime)) {
      const iso = `${rawTime.slice(0, 4)}-${rawTime.slice(4, 6)}-${rawTime.slice(6, 8)}T${rawTime.slice(8, 10)}:${rawTime.slice(10, 12)}:00Z`
      return new Date(iso).toISOString()
    }
    
    // Check if it's the YYYYMMDDHHmmss format (e.g. 20240115103000)
    if (/^\d{14}$/.test(rawTime)) {
      const iso = `${rawTime.slice(0, 4)}-${rawTime.slice(4, 6)}-${rawTime.slice(6, 8)}T${rawTime.slice(8, 10)}:${rawTime.slice(10, 12)}:${rawTime.slice(12, 14)}Z`
      return new Date(iso).toISOString()
    }

    // Otherwise, assume it's a standard format like 'Mon May 19 13:30:54 EAT 2025' and let Date parse it
    try {
      const d = new Date(rawTime.replace('EAT', 'GMT+0300'))
      if (!isNaN(d.getTime())) return d.toISOString()
    } catch {}

    return new Date().toISOString()
  })()

  return {
    provider: 'buni',
    event: 'payment.success',
    transactionId,
    amount: Number(amountStr),
    phone,
    reference,
    completedAt,
    raw: payload,
  }
}
