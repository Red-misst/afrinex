import { BUNI_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedBuniConfig } from '../../types/config'
import type { PaymentQueryRequest, PaymentQueryResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface BuniQueryRawResponse {
  TransID?: string
  TransAmount?: number
  MSISDN?: string
  BillRefNumber?: string
  TransTime?: string
  ResponseCode?: string
}

export async function query(
  req: PaymentQueryRequest,
  _config: ResolvedBuniConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<PaymentQueryResponse> {
  const headers = await auth.headers()

  const response = await http.post<BuniQueryRawResponse>(
    BUNI_PATHS.query,
    { payload: { requestId: req.transactionId } },
    headers,
  )

  return {
    transactionId: response.TransID ?? req.transactionId,
    status: 'success',  // Buni reconciliation returns only completed transactions
    amount: response.TransAmount ?? 0,
    phone: response.MSISDN ?? '',
    reference: response.BillRefNumber ?? req.reference ?? '',
    raw: response,
  }
}
