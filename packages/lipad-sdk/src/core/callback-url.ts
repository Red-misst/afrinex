import { ConfigurationError } from '../errors/config-error'
import type { ProviderName } from '../types/provider'

interface ResolveCallbackUrlOpts {
  request?: string | undefined
  global?: string | undefined
  provider: ProviderName
}

const PROVIDER_SLUGS: Record<ProviderName, string> = {
  daraja: '/daraja',
  jenga: '/jenga',
  buni: '/buni',
}

/**
 * Resolves the callback URL for a provider request.
 *
 * Priority:
 *   1. request-level callbackUrl
 *   2. global callbackUrl from config
 *   3. LIPAD_CALLBACK_URL environment variable
 *   4. throws ConfigurationError
 *
 * Automatically appends the provider slug (/daraja, /jenga, /buni).
 * Strips trailing slashes from the base URL before appending.
 */
export function resolveCallbackUrl(opts: ResolveCallbackUrlOpts): string {
  const base =
    opts.request ??
    opts.global ??
    process.env['LIPAD_CALLBACK_URL']

  if (!base) {
    throw new ConfigurationError(
      'A callbackUrl is required. Pass it to createClient(), per-request, or set LIPAD_CALLBACK_URL.'
    )
  }

  // Strip trailing slash before appending provider slug
  const stripped = base.replace(/\/+$/, '')
  return stripped + PROVIDER_SLUGS[opts.provider]
}
