export interface StkPushRequest {
  phone: string       // accepts 07XX, +2547XX, 2547XX — normalized internally
  amount: number
  reference: string
  callbackUrl?: string // overrides global callbackUrl for this request only
  description?: string
}

export interface TransferToPhoneRequest {
  phone: string
  amount: number
  reference: string
  callbackUrl?: string
  remarks?: string
}

export interface PaymentQueryRequest {
  transactionId: string
  reference?: string
}

export interface BalanceRequest {
  remarks?: string
  callbackUrl?: string
}
