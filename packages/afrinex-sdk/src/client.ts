import type { AfrinexConfig } from './types/config'
import type { AfrinexClient } from './types/client'
import type { IProvider } from './types/provider'

export function createClient(config: AfrinexConfig): AfrinexClient {
  const providers = config.providers || {}
  
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
    }
  }
}
