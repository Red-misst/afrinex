export const JENGA_URLS = {
  sandbox: 'https://uat.finserve.africa',
  production: 'https://api.finserve.africa',
} as const

export const JENGA_PATHS = {
  stkPush: '/transaction/v3/to-mobile',
  transfer: '/transaction/v3/to-mobile',
  query: '/transaction/v3/details',
} as const
