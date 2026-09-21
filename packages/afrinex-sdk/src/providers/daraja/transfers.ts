import { normalizePhone } from '../../core/phone'
import { resolveCallbackUrl } from '../../core/callback-url'
import { generateSecurityCredential } from '../../core/crypto'
import { DARAJA_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedDarajaConfig } from '../../types/config'
import type { TransferToPhoneRequest, TransferResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

interface DarajaTransferRawResponse {
  OriginatorConversationID?: string
  ConversationID?: string
  ResponseCode: string
  ResponseDescription: string
}

export async function toPhone(
  req: TransferToPhoneRequest,
  config: ResolvedDarajaConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<TransferResponse> {
  const phone = normalizePhone(req.phone)
  const callbackUrl = resolveCallbackUrl({
    ...(req.callbackUrl !== undefined ? { request: req.callbackUrl } : {}),
    provider: 'daraja',
  })
  
  if (!config.initiatorName) {
    throw new Error('initiatorName is required in Daraja config for B2C transfers')
  }

  const securityCredential = generateSecurityCredential(config.initiatorPassword, config.certPath)
  const headers = await auth.headers()

  const body = {
    InitiatorName: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment',
    Amount: req.amount,
    PartyA: config.shortcode,
    PartyB: phone,
    Remarks: req.remarks ?? req.reference,
    QueueTimeOutURL: callbackUrl + '/timeout',
    ResultURL: callbackUrl,
    Occassion: req.reference,
  }

  const response = await http.post<DarajaTransferRawResponse>(
    DARAJA_PATHS.b2c,
    body,
    headers,
  )

  return {
    success: response.ResponseCode === '0',
    transactionId: response.ConversationID ?? response.OriginatorConversationID ?? '',
    message: response.ResponseDescription,
    raw: response,
  }
}
