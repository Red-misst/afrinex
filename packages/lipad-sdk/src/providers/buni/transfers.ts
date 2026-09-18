import { normalizePhone } from '../../core/phone'
import { resolveCallbackUrl } from '../../core/callback-url'
import { BUNI_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedBuniConfig } from '../../types/config'
import type { TransferToPhoneRequest, TransferResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface BuniTransferRawResponse {
  ResponseCode: string
  ResponseDescription: string
  TransactionID?: string
  OriginatorConversationID?: string
}

export async function toPhone(
  req: TransferToPhoneRequest,
  config: ResolvedBuniConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<TransferResponse> {
  const phone = normalizePhone(req.phone)
  const callbackUrl = resolveCallbackUrl({
    ...(req.callbackUrl !== undefined ? { request: req.callbackUrl } : {}),
    provider: 'buni',
  })

  const headers = await auth.headers()

  const body = {
    OrgShortCode: config.orgShortCode,
    CommandID: 'BusinessPayment',
    Amount: req.amount,
    Msisdn: phone,
    Remarks: req.remarks ?? req.reference,
    QueueTimeOutURL: callbackUrl + '/timeout',
    ResultURL: callbackUrl,
    Occassion: req.reference,
  }

  const response = await http.post<BuniTransferRawResponse>(
    BUNI_PATHS.transfer,
    body,
    headers,
  )

  return {
    success: response.ResponseCode === '0',
    transactionId: response.TransactionID ?? response.OriginatorConversationID ?? '',
    message: response.ResponseDescription,
    raw: response,
  }
}
