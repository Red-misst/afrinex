import { ConfigurationError } from '../errors/config-error'
import type { AfrinexConfig, ResolvedAfrinexConfig } from '../types/config'
import { DARAJA_URLS } from '../providers/daraja/constants'
import { BUNI_URLS } from '../providers/buni/constants'

/**
 * Resolves a AfrinexConfig into a fully validated ResolvedAfrinexConfig.
 *
 * For each provider:
 *   1. Credentials are resolved from the config object first, then env vars
 *   2. Missing required credentials throw ConfigurationError immediately
 *   3. baseUrl is attached from the provider's constants.ts
 *   4. In sandbox mode, warns if credentials came from env vars
 */
export function resolveConfig(input: AfrinexConfig): ResolvedAfrinexConfig {
  const resolved: ResolvedAfrinexConfig = {
    env: input.env,
    ...(input.callbackUrl !== undefined ? { callbackUrl: input.callbackUrl } : {}),
    ...(input.default !== undefined ? { default: input.default } : {}),
  }

  // ── Daraja ──────────────────────────────────────────────────────────────────
  if (input.daraja !== undefined) {
    const fromEnv: string[] = []

    const consumerKey = resolveCredential(
      input.daraja.consumerKey,
      'AFRINEX_DARAJA_CONSUMER_KEY',
      'Daraja consumerKey is required. Pass it to createClient() or set AFRINEX_DARAJA_CONSUMER_KEY.',
      fromEnv,
    )
    const consumerSecret = resolveCredential(
      input.daraja.consumerSecret,
      'AFRINEX_DARAJA_CONSUMER_SECRET',
      'Daraja consumerSecret is required. Pass it to createClient() or set AFRINEX_DARAJA_CONSUMER_SECRET.',
      fromEnv,
    )
    const shortcode = resolveCredential(
      input.daraja.shortcode,
      'AFRINEX_DARAJA_SHORTCODE',
      'Daraja shortcode is required. Pass it to createClient() or set AFRINEX_DARAJA_SHORTCODE.',
      fromEnv,
    )
    const passkey = resolveCredential(
      input.daraja.passkey,
      'AFRINEX_DARAJA_PASSKEY',
      'Daraja passkey is required. Pass it to createClient() or set AFRINEX_DARAJA_PASSKEY.',
      fromEnv,
    )

    if (input.env === 'sandbox' && fromEnv.length > 0) {
      console.warn('[afrinex] sandbox · daraja credentials resolved from environment')
    }

    resolved.daraja = {
      consumerKey,
      consumerSecret,
      shortcode,
      passkey,
      baseUrl: DARAJA_URLS[input.env],
    }
  }

  // ── Buni ────────────────────────────────────────────────────────────────────
  if (input.buni !== undefined) {
    const fromEnv: string[] = []

    const consumerKey = resolveCredential(
      input.buni.consumerKey,
      'AFRINEX_BUNI_CONSUMER_KEY',
      'Buni consumerKey is required. Pass it to createClient() or set AFRINEX_BUNI_CONSUMER_KEY.',
      fromEnv,
    )
    const consumerSecret = resolveCredential(
      input.buni.consumerSecret,
      'AFRINEX_BUNI_CONSUMER_SECRET',
      'Buni consumerSecret is required. Pass it to createClient() or set AFRINEX_BUNI_CONSUMER_SECRET.',
      fromEnv,
    )
    const orgShortCode = resolveCredential(
      input.buni.orgShortCode,
      'AFRINEX_BUNI_ORG_SHORT_CODE',
      'Buni orgShortCode is required. Pass it to createClient() or set AFRINEX_BUNI_ORG_SHORT_CODE.',
      fromEnv,
    )

    if (input.env === 'sandbox' && fromEnv.length > 0) {
      console.warn('[afrinex] sandbox · buni credentials resolved from environment')
    }

    resolved.buni = {
      consumerKey,
      consumerSecret,
      orgShortCode,
      baseUrl: BUNI_URLS[input.env],
    }
  }

  return resolved
}

/**
 * Resolves a credential value from an explicit value or an env var.
 * Pushes the env var name into `fromEnv` if the env var was used.
 * Throws ConfigurationError if neither is available.
 */
function resolveCredential(
  explicit: string | undefined,
  envVar: string,
  errorMessage: string,
  fromEnv: string[],
): string {
  if (explicit !== undefined && explicit !== '') {
    return explicit
  }

  const fromEnvironment = process.env[envVar]
  if (fromEnvironment !== undefined && fromEnvironment !== '') {
    fromEnv.push(envVar)
    return fromEnvironment
  }

  throw new ConfigurationError(errorMessage)
}
