export const JENGA_URLS = {
  sandbox: 'https://uat.finserve.africa',
  production: 'https://api.finserve.africa',
} as const

export const JENGA_PATHS = {
  auth: '/authentication/api/v3/authenticate/merchant',
  stkPush: '/v3-apis/payment-api/v3.0/stkussdpush/initiate',
  transfer: '/v3-apis/transaction-api/v3.0/remittance/sendmobile',
  query: '/v3-apis/transaction-api/v3.0/transactions/details',
} as const
