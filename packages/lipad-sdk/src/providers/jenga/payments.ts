import { JENGA_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedJengaConfig } from '../../types/config'
import type { PaymentQueryRequest, PaymentQueryResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface JengaQueryRawResponse {
  transactionReference: string
  amount: number
  status: string
  sourceAccountNumber?: string
  destinationAccountNumber?: string
  transactionDate?: string
}

function mapStatus(status: string): 'success' | 'failed' | 'pending' {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'failed'
  return 'pending'
}

export async function query(
  req: PaymentQueryRequest,
  config: ResolvedJengaConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<PaymentQueryResponse> {
  const signingPayload = config.merchantCode + (req.reference ?? req.transactionId)
  const headers = await auth.headers({ signingPayload })

  const response = await http.get<JengaQueryRawResponse>(
    `${JENGA_PATHS.query}/${req.transactionId}`,
    headers,
  )

  return {
    transactionId: response.transactionReference,
    status: mapStatus(response.status),
    amount: response.amount,
    phone: response.destinationAccountNumber ?? '',
    reference: req.reference ?? req.transactionId,
    raw: response,
  }
}
