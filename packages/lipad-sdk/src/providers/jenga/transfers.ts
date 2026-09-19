import { normalizePhone } from '../../core/phone'
import { resolveCallbackUrl } from '../../core/callback-url'
import { JENGA_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedJengaConfig } from '../../types/config'
import type { TransferToPhoneRequest, TransferResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface JengaTransferRawResponse {
  transactionReference: string
  status: string
  description?: string
}

/**
 * Jenga transfer to phone (B2C).
 * Uses same endpoint as STK push — Jenga uses /transaction/v3/to-mobile for both.
 * Signing payload = merchantCode + amount + reference
 */
export async function toPhone(
  req: TransferToPhoneRequest,
  config: ResolvedJengaConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<TransferResponse> {
  const phone = normalizePhone(req.phone)
  const callbackUrl = resolveCallbackUrl({
    ...(req.callbackUrl !== undefined ? { request: req.callbackUrl } : {}),
    provider: 'jenga',
  })

  const dateStr = new Date().toISOString().split('T')[0]
  const walletName = phone.startsWith('25476') ? 'Equitel' : 'Mpesa'

  const signingPayload = `${req.amount}KES${req.reference}${config.merchantCode}`
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
      name: 'Recipient',
      mobileNumber: phone,
      walletName: walletName,
    },
    transfer: {
      type: 'MobileWallet',
      amount: String(req.amount),
      currencyCode: 'KES',
      reference: req.reference,
      date: dateStr,
      description: req.remarks ?? req.reference,
      callbackUrl,
    },
  }

  const response = await http.post<JengaTransferRawResponse>(
    JENGA_PATHS.transfer,
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
