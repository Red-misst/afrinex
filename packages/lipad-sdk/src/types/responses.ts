export interface StkPushResponse {
  success: boolean
  transactionId: string  // provider-native checkout/request ID
  message: string
  raw: unknown
}

export interface TransferResponse {
  success: boolean
  transactionId: string
  message: string
  raw: unknown
}

export interface PaymentQueryResponse {
  transactionId: string
  status: 'success' | 'failed' | 'pending'
  amount: number
  phone: string
  reference: string
  raw: unknown
}
