import type { Environment, ProviderName } from './provider'

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
  default?: ProviderName
  daraja?: DarajaConfig
  buni?: BuniConfig
}

// Internal resolved config — all fields guaranteed present after resolveConfig()
export interface ResolvedDarajaConfig extends DarajaConfig {
  baseUrl: string
}

export interface ResolvedBuniConfig extends BuniConfig {
  baseUrl: string
}

export interface ResolvedAfrinexConfig {
  env: Environment
  callbackUrl?: string
  default?: ProviderName
  daraja?: ResolvedDarajaConfig
  buni?: ResolvedBuniConfig
}
