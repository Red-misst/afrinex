import { AfrinexError } from './base'

export class ProviderError extends AfrinexError {
  readonly providerCode: string
  readonly providerMessage: string
  readonly raw: unknown

  constructor(opts: {
    provider: string
    providerCode: string
    providerMessage: string
    raw: unknown
  }) {
    super('PROVIDER_ERROR', `[${opts.provider}] ${opts.providerMessage}`, opts.provider)
    this.name = 'ProviderError'
    this.providerCode = opts.providerCode
    this.providerMessage = opts.providerMessage
    this.raw = opts.raw
  }
}
