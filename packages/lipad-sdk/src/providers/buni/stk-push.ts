import { normalizePhone } from '../../core/phone'
import { resolveCallbackUrl } from '../../core/callback-url'
import { BUNI_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedBuniConfig } from '../../types/config'
import type { StkPushRequest, StkPushResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface BuniStkPushRawResponse {
  ResponseCode: string
  ResponseDescription: string
  CheckoutRequestID?: string
  MerchantRequestID?: string
}

export async function stkPush(
  req: StkPushRequest,
  config: ResolvedBuniConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<StkPushResponse> {
  const phone = normalizePhone(req.phone)
  const callbackUrl = resolveCallbackUrl({
    ...(req.callbackUrl !== undefined ? { request: req.callbackUrl } : {}),
    provider: 'buni',
  })

  const headers = await auth.headers()

  const body = {
    OrgShortCode: config.orgShortCode,
    CommandID: 'CustomerPayBillOnline',
    Amount: req.amount,
    Msisdn: phone,
    BillRefNumber: req.reference,
    CallBackURL: callbackUrl,
  }

  const response = await http.post<BuniStkPushRawResponse>(
    BUNI_PATHS.stkPush,
    body,
    headers,
  )

  return {
    success: response.ResponseCode === '0',
    transactionId: response.CheckoutRequestID ?? response.MerchantRequestID ?? '',
    message: response.ResponseDescription,
    raw: response,
  }
}
