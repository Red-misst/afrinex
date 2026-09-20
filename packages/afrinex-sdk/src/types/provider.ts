export type Environment = 'sandbox' | 'production'

export interface AuthContext {
  // Reserved for future provider-specific signing context
}

export interface AuthStrategy {
  headers(context?: AuthContext): Promise<Record<string, string>>
}

import type {
  StkPushRequest,
  TransferToPhoneRequest,
  PaymentQueryRequest,
  BalanceRequest,
} from './requests'

import type {
  StkPushResponse,
  TransferResponse,
  PaymentQueryResponse,
  BalanceResponse,
} from './responses'

export interface IProvider {
  readonly name: string;
  stkPush(request: StkPushRequest): Promise<StkPushResponse>;
  transfers: {
    toPhone(request: TransferToPhoneRequest): Promise<TransferResponse>;
  };
  payments: {
    query(request: PaymentQueryRequest): Promise<PaymentQueryResponse>;
  };
  balances(request?: BalanceRequest): Promise<BalanceResponse>;
}
