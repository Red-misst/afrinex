import { normalizePhone } from '../../core/phone'
import { resolveCallbackUrl } from '../../core/callback-url'
import { BUNI_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedBuniConfig } from '../../types/config'
import type { StkPushRequest, StkPushResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface BuniStkPushRawResponse {
  header: {
    statusCode: string
    statusDescription: string
  }
  response: {
    ResponseCode: string
    ResponseDescription: string
    CheckoutRequestID?: string
    MerchantRequestID?: string
  }
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

  const authHeaders = await auth.headers()
  
  const messageId = `${Date.now()}_KCBOrg_${Math.floor(Math.random() * 100000000)}`

  const headers = {
    ...authHeaders,
    'accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'routeCode': '207',
    'operation': 'STKPush',
    'messageId': messageId,
  }

  const body = {
    phoneNumber: phone,
    amount: String(req.amount),
    invoiceNumber: req.reference,
    sharedShortCode: true,
    orgShortCode: "",
    orgPassKey: "",
    callbackUrl: callbackUrl,
    transactionDescription: req.description || 'Payment',
  }

  const raw = await http.post<BuniStkPushRawResponse>(
    BUNI_PATHS.stkPush,
    body,
    headers,
  )

  const res = raw.response || {}

  return {
    success: res.ResponseCode === '0' || raw.header?.statusCode === '0',
    transactionId: res.CheckoutRequestID ?? res.MerchantRequestID ?? '',
    message: res.ResponseDescription ?? raw.header?.statusDescription ?? '',
    raw,
  }
}
