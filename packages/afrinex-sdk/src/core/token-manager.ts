import { Mutex } from 'async-mutex'
import { AuthError } from '../errors/auth-error'

interface TokenManagerOptions {
  fetchToken: () => Promise<{ token: string; expiresIn: number }>
  provider: string
}

/**
 * Thread-safe token cache with double-checked locking.
 *
 * Fast path: no lock needed if token is still valid.
 * Slow path: mutex-protected refresh with re-check inside lock to prevent
 * thundering herd (10 concurrent callers → exactly 1 fetchToken() call).
 *
 * Expiry is buffered by 30 seconds to avoid using a token that expires
 * mid-request.
 */
export class TokenManager {
  private token: string | null = null
  private expiresAt: number = 0
  private mutex = new Mutex()

  constructor(private opts: TokenManagerOptions) {}

  async getToken(): Promise<string> {
    // Fast path — no lock needed if token is valid
    if (this.token !== null && Date.now() < this.expiresAt) {
      return this.token
    }

    return this.mutex.runExclusive(async () => {
      // Re-check inside lock — another request may have refreshed already
      if (this.token !== null && Date.now() < this.expiresAt) {
        return this.token
      }

      try {
        const { token, expiresIn } = await this.opts.fetchToken()
        this.token = token
        // Subtract 30-second buffer from expiry
        this.expiresAt = Date.now() + (expiresIn - 30) * 1000
        return this.token
      } catch (err) {
        throw new AuthError(this.opts.provider, (err as Error).message)
      }
    })
  }

  /** Exposed for testing only — forces the next getToken() to refresh */
  invalidate(): void {
    this.token = null
    this.expiresAt = 0
  }
}
