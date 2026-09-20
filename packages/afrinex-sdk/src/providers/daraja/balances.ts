import { DARAJA_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedDarajaConfig } from '../../types/config'
import type { BalanceRequest, BalanceResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

export async function balances(
  req: BalanceRequest,
  config: ResolvedDarajaConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<BalanceResponse> {
  const headers = await auth.headers()
  
  // In a real scenario, this would POST to DARAJA_PATHS.accountBalance 
  // and the balance would be delivered asynchronously via callbackUrl.
  // For the sake of this agent integration demo, we return a mocked sync response.

  return {
    success: true,
    balance: 85000,
    currency: 'KES',
    message: 'Mock Daraja balance retrieved successfully',
    raw: { status: 'mocked', provider: 'daraja' },
  }
}
