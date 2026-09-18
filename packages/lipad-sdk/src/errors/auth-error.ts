import { LipadError } from './base'

export class AuthError extends LipadError {
  constructor(provider: string, message: string) {
    super('AUTH_FAILED', `[${provider}] Auth failed: ${message}`, provider)
    this.name = 'AuthError'
  }
}
