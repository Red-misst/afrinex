import { BaseProvider } from '../../core/base-provider'
import { stkPush } from './stk-push'
import { query } from './payments'
import { parse } from './webhooks'
import type { AuthStrategy } from '../../types/provider'
import type { Environment } from '../../types/provider'
import type { ResolvedDarajaConfig } from '../../types/config'
import type {
  StkPushRequest,
  StkPushResponse,
  TransferToPhoneRequest,
  TransferResponse,
  PaymentQueryRequest,
  PaymentQueryResponse,
  UnifiedWebhookPayload,
} from '../../types'

export class DarajaProvider extends BaseProvider {
  private config: ResolvedDarajaConfig

  constructor(config: ResolvedDarajaConfig, env: Environment, auth: AuthStrategy) {
    super({ name: 'daraja', baseUrl: config.baseUrl, env, auth })
    this.config = config
  }

  async stkPush(req: StkPushRequest): Promise<StkPushResponse> {
    return stkPush(req, this.config, this.auth, this.http)
  }

  transfers = {
    toPhone: (_req: TransferToPhoneRequest): Promise<TransferResponse> => {
      return this.notSupported('transfers.toPhone')
    },
  }

  payments = {
    query: (req: PaymentQueryRequest): Promise<PaymentQueryResponse> => {
      return query(req, this.config, this.auth, this.http)
    },
  }

  webhooks = {
    parse: (payload: unknown): UnifiedWebhookPayload => {
      return parse(payload)
    },
  }
}
