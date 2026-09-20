import type { Environment, IProvider } from './provider'

export interface DarajaConfig {
  consumerKey: string
  consumerSecret: string
  shortcode: string
  passkey: string
}

export interface BuniConfig {
  consumerKey: string
  consumerSecret: string
  orgShortCode: string
}

export interface AfrinexConfig {
  env: Environment
  callbackUrl?: string
  default?: string
  providers: Record<string, IProvider>
}

export interface ResolvedDarajaConfig extends DarajaConfig {
  baseUrl: string
}

export interface ResolvedBuniConfig extends BuniConfig {
  baseUrl: string
}

// Internal resolved config — all fields guaranteed present after resolveConfig()
export interface ResolvedAfrinexConfig {
  env: Environment
  callbackUrl?: string
  default?: string
  providers: Record<string, IProvider>
}
