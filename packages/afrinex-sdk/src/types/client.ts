import type { IProvider } from './provider'

export interface AfrinexClient {
  getProvider(name: string): IProvider
  getProviderNames(): string[]
}
