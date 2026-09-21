import type { IProvider } from './provider'
import type { EventEmitter } from 'events'

export interface AfrinexClient {
  getProvider(name: string): IProvider
  getProviderNames(): string[]
  events: EventEmitter
  handleWebhook(providerName: string, payload: any): any
}
