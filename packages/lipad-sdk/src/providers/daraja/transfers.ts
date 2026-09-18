import type { TransferToPhoneRequest, TransferResponse } from '../../types'

/**
 * Daraja B2C transfer — intentionally not implemented in v1.
 *
 * B2C requires SecurityCredential generation (initiator password encrypted
 * with Daraja's public certificate), which is scheduled for v1.1.
 *
 * We throw clearly rather than silently failing or returning a stub response.
 */
export function toPhone(_req: TransferToPhoneRequest): Promise<TransferResponse> {
  throw new Error(
    '[daraja] Daraja B2C requires SecurityCredential generation — coming in v1.1'
  )
}
