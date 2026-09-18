export type LipadErrorCode =
  | 'PROVIDER_CAPABILITY_ERROR'
  | 'AUTH_FAILED'
  | 'PROVIDER_ERROR'
  | 'CONFIGURATION_ERROR'

export class LipadError extends Error {
  readonly code: LipadErrorCode
  readonly provider?: string

  constructor(code: LipadErrorCode, message: string, provider?: string) {
    super(message)
    this.name = 'LipadError'
    this.code = code
    if (provider !== undefined) {
      this.provider = provider
    }
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
