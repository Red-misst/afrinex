import { BaseProvider } from '../../core/base-provider'
import { stkPush } from './stk-push'
import { query } from './payments'
import { parse } from './webhooks'
import { balances } from './balances'
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
  BalanceRequest,
  BalanceResponse,
} from '../../types'

export class DarajaProvider extends BaseProvider {
  private config: ResolvedDarajaConfig

  constructor(config: Omit<ResolvedDarajaConfig, 'baseUrl'>, env: Environment) {
    const { DARAJA_URLS } = require('./constants')
    const { createDarajaAuth } = require('./auth')
    const baseUrl = DARAJA_URLS[env]
    const resolvedConfig = { ...config, baseUrl }
    const { HttpClient } = require('../../core/http-client')
    const http = new HttpClient(baseUrl)
    const auth = createDarajaAuth(resolvedConfig, http)
    
    super({ name: 'daraja', baseUrl, env, auth })
    this.config = resolvedConfig
    // override the base http with the one we created for auth
    this.http = http
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

  async balances(req?: BalanceRequest): Promise<BalanceResponse> {
    return balances(req || {}, this.config, this.auth, this.http)
  }
}
