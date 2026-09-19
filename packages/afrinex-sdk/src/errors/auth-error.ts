import { AfrinexError } from './base'

export class AuthError extends AfrinexError {
  constructor(provider: string, message: string) {
    super('AUTH_FAILED', `[${provider}] Auth failed: ${message}`, provider)
    this.name = 'AuthError'
  }
}
