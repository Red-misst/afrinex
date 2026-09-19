import { AfrinexError } from './base'

export class ProviderCapabilityError extends AfrinexError {
  constructor(provider: string, method: string) {
    super(
      'PROVIDER_CAPABILITY_ERROR',
      `[${provider}] '${method}' is not supported by this provider`,
      provider
    )
    this.name = 'ProviderCapabilityError'
  }
}
