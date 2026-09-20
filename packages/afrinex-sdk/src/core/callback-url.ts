import { ConfigurationError } from '../errors/config-error'

interface ResolveCallbackUrlOpts {
  request?: string | undefined
  global?: string | undefined
  provider: string
}

/**
 * Resolves the callback URL for a provider request.
 *
 * Priority:
 *   1. request-level callbackUrl
 *   2. global callbackUrl from config
 *   3. AFRINEX_CALLBACK_URL environment variable
 *   4. throws ConfigurationError
 *
 * Automatically appends the provider slug (e.g., /daraja, /buni).
 * Strips trailing slashes from the base URL before appending.
 */
export function resolveCallbackUrl(opts: ResolveCallbackUrlOpts): string {
  const base =
    opts.request ??
    opts.global ??
    process.env['AFRINEX_CALLBACK_URL']

  if (!base) {
    throw new ConfigurationError(
      'A callbackUrl is required. Pass it to createClient(), per-request, or set AFRINEX_CALLBACK_URL.'
    )
  }

  // Strip trailing slash before appending provider slug
  const stripped = base.replace(/\/+$/, '')
  return `${stripped}/${opts.provider}`
}
