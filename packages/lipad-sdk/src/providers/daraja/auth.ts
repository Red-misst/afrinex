import { TokenManager } from '../../core/token-manager'
import { HttpClient } from '../../core/http-client'
import { DARAJA_PATHS } from './constants'
import type { ResolvedDarajaConfig } from '../../types/config'
import type { AuthStrategy } from '../../types/provider'

interface DarajaTokenResponse {
  access_token: string
  expires_in: string // Daraja returns this as a string — must parseInt
}

/**
 * Creates the Daraja OAuth2 AuthStrategy.
 *
 * Uses Basic auth (consumerKey:consumerSecret base64-encoded) to fetch
 * a bearer token. Token is cached by TokenManager with a 30s expiry buffer.
 *
 * Note: Daraja returns expires_in as a string — we parseInt() it.
 */
export function createDarajaAuth(
  config: ResolvedDarajaConfig,
  http: HttpClient,
): AuthStrategy {
  const tokenManager = new TokenManager({
    provider: 'daraja',
    fetchToken: async () => {
      const encoded = Buffer.from(
        `${config.consumerKey}:${config.consumerSecret}`
      ).toString('base64')

      const response = await http.get<DarajaTokenResponse>(DARAJA_PATHS.auth, {
        Authorization: `Basic ${encoded}`,
      })

      return {
        token: response.access_token,
        expiresIn: parseInt(response.expires_in, 10),
      }
    },
  })

  return {
    async headers() {
      const token = await tokenManager.getToken()
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    },
  }
}
