import type { LipadConfig } from './types/config'
import type { LipadClient } from './types/client'
import { resolveConfig } from './core/config'
import { DarajaProvider } from './providers/daraja'
import { JengaProvider } from './providers/jenga'
import { BuniProvider } from './providers/buni'
import { createDarajaAuth } from './providers/daraja/auth'
import { createJengaAuth } from './providers/jenga/auth'
import { createBuniAuth } from './providers/buni/auth'
import { HttpClient } from './core/http-client'

/**
 * Creates a Lipad client with the given configuration.
 *
 * Only providers with config present are instantiated.
 * Each provider gets its own HttpClient, AuthStrategy, and resolved config.
 *
 * Throws ConfigurationError immediately if any required credential is missing.
 *
 * @example
 * const pay = createClient({
 *   env: 'sandbox',
 *   callbackUrl: 'https://myapp.com/webhooks',
 *   daraja: { consumerKey: '...', consumerSecret: '...', shortcode: '174379', passkey: '...' },
 * })
 * const result = await pay.daraja!.stkPush({ phone: '0712345678', amount: 1, reference: 'inv-001' })
 */
export function createClient(config: LipadConfig): LipadClient {
  const resolved = resolveConfig(config)

  const client: Partial<LipadClient> = {}

  if (resolved.daraja !== undefined) {
    const http = new HttpClient(resolved.daraja.baseUrl)
    const auth = createDarajaAuth(resolved.daraja, http)
    client.daraja = new DarajaProvider(resolved.daraja, resolved.env, auth)
  }

  if (resolved.jenga !== undefined) {
    const auth = createJengaAuth(resolved.jenga, resolved.env)
    client.jenga = new JengaProvider(resolved.jenga, resolved.env, auth)
  }

  if (resolved.buni !== undefined) {
    const http = new HttpClient(resolved.buni.baseUrl)
    const auth = createBuniAuth(resolved.buni, http)
    client.buni = new BuniProvider(resolved.buni, resolved.env, auth)
  }

  return client as LipadClient
}
