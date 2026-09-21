import { TokenManager } from '../../core/token-manager'
import { HttpClient } from '../../core/http-client'
import { BUNI_PATHS } from './constants'
import type { ResolvedBuniConfig } from '../../types/config'
import type { AuthStrategy } from '../../types/provider'

interface BuniTokenResponse {
  access_token: string
  expires_in: number // Buni returns this as a number — no parseInt needed
}

/**
 * Creates the Buni OAuth2 AuthStrategy.
 *
 * Unlike Daraja, Buni's auth endpoint uses:
 *   - POST (not GET)
 *   - application/x-www-form-urlencoded body (not a query param)
 *   - expires_in is already a number (no parseInt needed)
 */
export function createBuniAuth(
  config: ResolvedBuniConfig,
  http: HttpClient,
): AuthStrategy {
  const tokenManager = new TokenManager({
    provider: 'buni',
    fetchToken: async () => {
      const encoded = Buffer.from(
        `${config.consumerKey}:${config.consumerSecret}`
      ).toString('base64')

      const body = 'grant_type=client_credentials'

      const response = await http.post<BuniTokenResponse>(BUNI_PATHS.auth, body, {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      })

      return {
        token: response.access_token,
        expiresIn: response.expires_in,
      }
    },
  })

  return {
    async headers() {
      const token = await tokenManager.getToken()
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
  }
}
