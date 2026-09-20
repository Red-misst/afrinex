import type { AuthStrategy, IProvider, Environment } from '../types/provider'
import type { StkPushRequest, TransferToPhoneRequest, PaymentQueryRequest, BalanceRequest } from '../types/requests'
import type { StkPushResponse, TransferResponse, PaymentQueryResponse, BalanceResponse } from '../types/responses'
import { HttpClient } from './http-client'
import { ProviderCapabilityError } from '../errors/capability-error'

/**
 * Abstract base class for all provider implementations.
 *
 * Provides:
 *   - this.http — shared HttpClient for the provider's baseUrl
 *   - this.env — sandbox | production
 *   - this.auth — the provider's AuthStrategy (token-based or signature-based)
 *   - this.name — provider identifier string
 *   - this.notSupported() — throws ProviderCapabilityError for unimplemented methods
 */
export abstract class BaseProvider implements IProvider {
  protected http: HttpClient
  protected env: Environment
  protected auth: AuthStrategy
  public readonly name: string

  constructor(opts: {
    name: string
    baseUrl: string
    env: Environment
    auth: AuthStrategy
  }) {
    this.name = opts.name
    this.env = opts.env
    this.auth = opts.auth
    this.http = new HttpClient(opts.baseUrl)
  }

  protected notSupported(method: string): never {
    throw new ProviderCapabilityError(this.name, method)
  }

  async stkPush(request: StkPushRequest): Promise<StkPushResponse> {
    this.notSupported('stkPush')
  }

  transfers = {
    toPhone: async (request: TransferToPhoneRequest): Promise<TransferResponse> => {
      this.notSupported('transfers.toPhone')
    }
  }

  payments = {
    query: async (request: PaymentQueryRequest): Promise<PaymentQueryResponse> => {
      this.notSupported('payments.query')
    }
  }

  async balances(request?: BalanceRequest): Promise<BalanceResponse> {
    this.notSupported('balances')
  }
}
