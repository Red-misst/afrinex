import { normalizePhone } from '../../core/phone'
import { resolveCallbackUrl } from '../../core/callback-url'
import { JENGA_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedJengaConfig } from '../../types/config'
import type { StkPushRequest, StkPushResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface JengaStkPushRawResponse {
  transactionReference: string
  status: string
  description?: string
}

/**
 * Jenga STK push.
 *
 * Signing payload = merchantCode + amount + reference
 * This is passed as context.signingPayload to auth.headers().
 */
export async function stkPush(
  req: StkPushRequest,
  config: ResolvedJengaConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<StkPushResponse> {
  const phone = normalizePhone(req.phone)
  const callbackUrl = resolveCallbackUrl({
    ...(req.callbackUrl !== undefined ? { request: req.callbackUrl } : {}),
    provider: 'jenga',
  })

  const telco = phone.startsWith('25476') ? 'Equitel' : 'Safaricom'
  const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const currency = 'KES'

  const signingPayload = `${config.merchantCode}${req.reference}${phone}${telco}${req.amount}${currency}`
  const headers = await auth.headers({ signingPayload })

  const body = {
    merchant: {
      countryCode: 'KE',
      accountNumber: config.merchantCode,
      name: 'merchant',
    },
    payment: {
      ref: req.reference,
      mobileNumber: phone,
      telco: telco,
      amount: String(req.amount),
      currency: currency,
      date: dateStr,
      callBackUrl: callbackUrl,
      pushType: 'STK',
    },
  }

  const response = await http.post<JengaStkPushRawResponse>(
    JENGA_PATHS.stkPush,
    body,
    headers,
  )

  return {
    success: response.status === 'SUCCESS' || response.status === '000',
    transactionId: response.transactionReference,
    message: response.description ?? response.status,
    raw: response,
  }
}
