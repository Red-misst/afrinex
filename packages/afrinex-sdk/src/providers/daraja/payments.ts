import { DARAJA_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedDarajaConfig } from '../../types/config'
import type { PaymentQueryRequest, PaymentQueryResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface DarajaStkQueryBody {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  CheckoutRequestID: string
}

interface DarajaStkQueryRawResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: string
  ResultDesc: string
}

function generateTimestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(shortcode + passkey + timestamp).toString('base64')
}

function mapResultCode(code: string): 'success' | 'failed' | 'pending' {
  if (code === '0') return 'success'
  if (code === '1032') return 'pending'
  return 'failed'
}

export async function query(
  req: PaymentQueryRequest,
  config: ResolvedDarajaConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<PaymentQueryResponse> {
  const timestamp = generateTimestamp()
  const password = generatePassword(config.shortcode, config.passkey, timestamp)
  const headers = await auth.headers()

  const body: DarajaStkQueryBody = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: req.transactionId,
  }

  const response = await http.post<DarajaStkQueryRawResponse>(
    DARAJA_PATHS.stkQuery,
    body,
    headers,
  )

  return {
    transactionId: req.transactionId,
    status: mapResultCode(response.ResultCode),
    amount: 0,       // Daraja STK query does not return amount
    phone: '',       // Daraja STK query does not return phone
    reference: req.reference ?? '',
    raw: response,
  }
}
