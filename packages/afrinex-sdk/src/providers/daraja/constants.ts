export const DARAJA_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
} as const

export const DARAJA_PATHS = {
  auth: '/oauth/v1/generate?grant_type=client_credentials',
  stkPush: '/mpesa/stkpush/v1/processrequest',
  stkQuery: '/mpesa/stkpushquery/v1/query',
  b2c: '/mpesa/b2c/v1/paymentrequest',
  b2cQuery: '/mpesa/transactionstatus/v1/query',
} as const
