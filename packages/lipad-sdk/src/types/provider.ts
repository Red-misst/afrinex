export type ProviderName = 'daraja' | 'jenga' | 'buni'

export type Environment = 'sandbox' | 'production'

export interface AuthContext {
  signingPayload?: string // only consumed by Jenga's SignatureBuilder
}

export interface AuthStrategy {
  headers(context?: AuthContext): Promise<Record<string, string>>
}
