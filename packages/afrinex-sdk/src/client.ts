import type { AfrinexConfig } from './types/config'
import type { AfrinexClient } from './types/client'
import type { IProvider } from './types/provider'
import { EventEmitter } from 'events'

export function createClient(config: AfrinexConfig): AfrinexClient {
  const providers = config.providers || {}
  const events = new EventEmitter()
  
  for (const provider of Object.values(providers)) {
    if ('setEventEmitter' in provider && typeof (provider as any).setEventEmitter === 'function') {
      (provider as any).setEventEmitter(events)
    }
  }
  
  return {
    getProvider(name: string): IProvider {
      const provider = providers[name]
      if (!provider) {
        throw new Error(`Provider '${name}' is not configured`)
      }
      return provider
    },
    getProviderNames(): string[] {
      return Object.keys(providers)
    },
    events,
    handleWebhook(providerName: string, payload: any): any {
      const provider = providers[providerName]
      if (!provider) {
        throw new Error(`Provider '${providerName}' is not configured`)
      }
      const event = provider.webhooks.parse(payload)
      
      // Emit generic webhook event
      events.emit('webhook', event)
      
      // Emit specific event for balance resolving
      if (event.event === 'balance.success' || event.event === 'balance.failed') {
        events.emit(`balance:${providerName}`, event)
      }
      
      return event
    }
  }
}
