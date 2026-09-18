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

  const signingPayload = config.merchantCode + req.amount.toString() + req.reference
  const headers = await auth.headers({ signingPayload })

  const body = {
    source: {
      countryCode: 'KE',
      name: 'merchant',
      accountNumber: config.merchantCode,
    },
    destination: {
      type: 'mobile',
      countryCode: 'KE',
      name: 'Customer',
      mobileNumber: phone,
    },
    transfer: {
      type: 'MobileMoney',
      amount: req.amount,
      currencyCode: 'KES',
      reference: req.reference,
      description: req.description ?? req.reference,
      callbackUrl,
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
