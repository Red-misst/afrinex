import { BaseProvider } from '../../core/base-provider'
import { stkPush } from './stk-push'
import { toPhone } from './transfers'
import { query } from './payments'
import { parse } from './webhooks'
import type { AuthStrategy } from '../../types/provider'
import type { Environment } from '../../types/provider'
import type { ResolvedBuniConfig } from '../../types/config'
import type {
  StkPushRequest,
  StkPushResponse,
  TransferToPhoneRequest,
  TransferResponse,
  PaymentQueryRequest,
  PaymentQueryResponse,
  UnifiedWebhookPayload,
} from '../../types'

export class BuniProvider extends BaseProvider {
  private config: ResolvedBuniConfig

  constructor(config: ResolvedBuniConfig, env: Environment, auth: AuthStrategy) {
    super({ name: 'buni', baseUrl: config.baseUrl, env, auth })
    this.config = config
  }

  async stkPush(req: StkPushRequest): Promise<StkPushResponse> {
    return stkPush(req, this.config, this.auth, this.http)
  }

  transfers = {
    toPhone: (req: TransferToPhoneRequest): Promise<TransferResponse> => {
      return toPhone(req, this.config, this.auth, this.http)
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
