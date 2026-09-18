import type { Environment, ProviderName } from './provider'

export interface DarajaConfig {
  consumerKey: string
  consumerSecret: string
  shortcode: string
  passkey: string
}

export interface JengaConfig {
  apiKey: string
  merchantCode: string
  consumerSecret: string
  privateKey?: string // optional in sandbox — auto-generated if absent
}

export interface BuniConfig {
  consumerKey: string
  consumerSecret: string
  orgShortCode: string
}

export interface LipadConfig {
  env: Environment
  callbackUrl?: string
  default?: ProviderName
  daraja?: DarajaConfig
  jenga?: JengaConfig
  buni?: BuniConfig
}

// Internal resolved config — all fields guaranteed present after resolveConfig()
export interface ResolvedDarajaConfig extends DarajaConfig {
  baseUrl: string
}

export interface ResolvedJengaConfig extends JengaConfig {
  baseUrl: string
}

export interface ResolvedBuniConfig extends BuniConfig {
  baseUrl: string
}

export interface ResolvedLipadConfig {
  env: Environment
  callbackUrl?: string
  default?: ProviderName
  daraja?: ResolvedDarajaConfig
  jenga?: ResolvedJengaConfig
  buni?: ResolvedBuniConfig
}
