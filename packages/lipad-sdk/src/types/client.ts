// Defined separately to avoid circular imports:
// config.ts cannot import from providers (providers import from config.ts),
// so LipadClient lives here and is re-exported from types/index.ts
import type { DarajaProvider } from '../providers/daraja'
import type { BuniProvider } from '../providers/buni'

export interface LipadClient {
  daraja?: DarajaProvider
  buni?: BuniProvider
}
