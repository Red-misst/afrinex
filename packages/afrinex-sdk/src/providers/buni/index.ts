import { BaseProvider } from '../../core/base-provider'
import { stkPush } from './stk-push'
import { toPhone } from './transfers'
import { query } from './payments'
import { parse } from './webhooks'
import { balances } from './balances'
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
  BalanceRequest,
  BalanceResponse,
} from '../../types'

export class BuniProvider extends BaseProvider {
  private config: ResolvedBuniConfig

  constructor(config: Omit<ResolvedBuniConfig, 'baseUrl'>, env: Environment) {
    const { BUNI_URLS } = require('./constants')
    const { createBuniAuth } = require('./auth')
    const baseUrl = BUNI_URLS[env]
    const resolvedConfig = { ...config, baseUrl }
    const { HttpClient } = require('../../core/http-client')
    const http = new HttpClient(baseUrl)
    const auth = createBuniAuth(resolvedConfig, http)
    
    super({ name: 'buni', baseUrl, env, auth })
    this.config = resolvedConfig
    // override the base http with the one we created for auth
    this.http = http
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

  async balances(req?: BalanceRequest): Promise<BalanceResponse> {
    return balances(req || {}, this.config, this.auth, this.http)
  }
}
