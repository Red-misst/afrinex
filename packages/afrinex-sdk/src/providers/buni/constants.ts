export const BUNI_URLS = {
  sandbox: 'https://uat.buni.kcbgroup.com',
  production: 'https://api.buni.kcbgroup.com',
} as const

export const BUNI_PATHS = {
  auth: '/token',
  stkPush: '/mm/api/request/1.0.0/stkpush',
  transfer: '/fundstransfer/1.0.0/api/v1/transfer',
  query: '/kcb/vendingGateway/v1/1.0.0/api/query/transaction-status',
  accountBalance: '/mm/api/request/1.0.0/accountbalance',
} as const
