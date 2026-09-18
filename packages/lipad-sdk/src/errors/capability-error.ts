import { LipadError } from './base'

export class ProviderCapabilityError extends LipadError {
  constructor(provider: string, method: string) {
    super(
      'PROVIDER_CAPABILITY_ERROR',
      `[${provider}] '${method}' is not supported by this provider`,
      provider
    )
    this.name = 'ProviderCapabilityError'
  }
}
