import { DARAJA_PATHS } from './constants'
import { resolveCallbackUrl } from '../../core/callback-url'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedDarajaConfig } from '../../types/config'
import type { BalanceRequest, BalanceResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'
import type { EventEmitter } from 'events'

export async function balances(
  req: BalanceRequest,
  config: ResolvedDarajaConfig,
  auth: AuthStrategy,
  http: HttpClient,
  emitter?: EventEmitter
): Promise<BalanceResponse> {
  const headers = await auth.headers()
  const callbackUrl = resolveCallbackUrl({
    ...(req.callbackUrl !== undefined ? { request: req.callbackUrl } : {}),
    provider: 'daraja',
  })

  const body = {
    CommandID: 'AccountBalance',
    PartyA: config.shortcode,
    IdentifierType: 4,
    Remarks: req.remarks ?? 'Balance Query',
    QueueTimeOutURL: callbackUrl + '/timeout',
    ResultURL: callbackUrl,
  }

  const response = await http.post<any>(
    DARAJA_PATHS.accountBalance,
    body,
    headers,
  )

  if (response.ResponseCode === '0' && emitter) {
    // Wait for the webhook via event emitter
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        emitter.removeListener('balance:daraja', listener)
        resolve({
          success: false,
          balance: 0,
          currency: 'KES',
          message: 'Timeout waiting for balance webhook',
          raw: response
        })
      }, 60000)

      const listener = (event: any) => {
        clearTimeout(timeout)
        resolve({
          success: event.event === 'balance.success',
          balance: event.amount ?? 0,
          currency: 'KES',
          message: 'Balance retrieved successfully via webhook',
          raw: event.raw
        })
      }
      emitter.once('balance:daraja', listener)
    })
  }

  // If no emitter or failed request, just return the synchronous acknowledgement
  return {
    success: response.ResponseCode === '0',
    balance: 0,
    currency: 'KES',
    message: response.ResponseDescription || 'Request accepted, but no event emitter attached to wait for webhook',
    raw: response,
  }
}
