export const BUNI_URLS = {
  sandbox: 'https://uat.buni.kcbgroup.com',
  production: 'https://api.buni.kcbgroup.com',
} as const

export const BUNI_PATHS = {
  auth: '/token',
  stkPush: '/mm/api/request/1.0.0/stkpush',
  transfer: '/mm/api/request/1.0.0/b2c',
  query: '/mm/api/request/1.0.0/reconciliation',
} as const
