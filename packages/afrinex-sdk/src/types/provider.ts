export type ProviderName = 'daraja' | 'buni'

export type Environment = 'sandbox' | 'production'

export interface AuthContext {
  // Reserved for future provider-specific signing context
}

export interface AuthStrategy {
  headers(context?: AuthContext): Promise<Record<string, string>>
}
