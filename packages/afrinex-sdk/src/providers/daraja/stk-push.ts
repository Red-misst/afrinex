import { normalizePhone } from '../../core/phone'
import { resolveCallbackUrl } from '../../core/callback-url'
import { DARAJA_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedDarajaConfig } from '../../types/config'
import type { StkPushRequest, StkPushResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface DarajaStkPushBody {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  TransactionType: string
  Amount: number
  PartyA: string
  PartyB: string
  PhoneNumber: string
  CallBackURL: string
  AccountReference: string
  TransactionDesc: string
}

interface DarajaStkPushRawResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

/**
 * Generates the Daraja STK push timestamp in YYYYMMDDHHmmss format.
 */
function generateTimestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
}

/**
 * Generates the Daraja STK push Password (base64 of shortcode+passkey+timestamp).
 */
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(shortcode + passkey + timestamp).toString('base64')
}

export async function stkPush(
  req: StkPushRequest,
  config: ResolvedDarajaConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<StkPushResponse> {
  const phone = normalizePhone(req.phone)
  const timestamp = generateTimestamp()
  const password = generatePassword(config.shortcode, config.passkey, timestamp)
  const callbackUrl = resolveCallbackUrl({
    ...(req.callbackUrl !== undefined ? { request: req.callbackUrl } : {}),
    provider: 'daraja',
  })

  const headers = await auth.headers()

  const body: DarajaStkPushBody = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: req.amount,
    PartyA: phone,
    PartyB: config.shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: req.reference,
    TransactionDesc: req.description ?? req.reference,
  }

  const response = await http.post<DarajaStkPushRawResponse>(
    DARAJA_PATHS.stkPush,
    body,
    headers,
  )

  return {
    success: response.ResponseCode === '0',
    transactionId: response.CheckoutRequestID,
    message: response.CustomerMessage,
    raw: response,
  }
}
