export type AfrinexErrorCode =
  | 'PROVIDER_CAPABILITY_ERROR'
  | 'AUTH_FAILED'
  | 'PROVIDER_ERROR'
  | 'CONFIGURATION_ERROR'

export class AfrinexError extends Error {
  readonly code: AfrinexErrorCode
  readonly provider?: string

  constructor(code: AfrinexErrorCode, message: string, provider?: string) {
    super(message)
    this.name = 'AfrinexError'
    this.code = code
    if (provider !== undefined) {
      this.provider = provider
    }
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
