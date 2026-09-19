// Defined separately to avoid circular imports:
// config.ts cannot import from providers (providers import from config.ts),
// so AfrinexClient lives here and is re-exported from types/index.ts
import type { DarajaProvider } from '../providers/daraja'
import type { BuniProvider } from '../providers/buni'

export interface AfrinexClient {
  daraja?: DarajaProvider
  buni?: BuniProvider
}
