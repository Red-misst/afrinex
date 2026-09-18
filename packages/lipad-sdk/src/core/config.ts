import { ConfigurationError } from '../errors/config-error'
import type { LipadConfig, ResolvedLipadConfig } from '../types/config'
import { DARAJA_URLS } from '../providers/daraja/constants'
import { JENGA_URLS } from '../providers/jenga/constants'
import { BUNI_URLS } from '../providers/buni/constants'

/**
 * Resolves a LipadConfig into a fully validated ResolvedLipadConfig.
 *
 * For each provider:
 *   1. Credentials are resolved from the config object first, then env vars
 *   2. Missing required credentials throw ConfigurationError immediately
 *   3. baseUrl is attached from the provider's constants.ts
 *   4. In sandbox mode, warns if credentials came from env vars
 */
export function resolveConfig(input: LipadConfig): ResolvedLipadConfig {
  const resolved: ResolvedLipadConfig = {
    env: input.env,
    ...(input.callbackUrl !== undefined ? { callbackUrl: input.callbackUrl } : {}),
    ...(input.default !== undefined ? { default: input.default } : {}),
  }

  // ── Daraja ──────────────────────────────────────────────────────────────────
  if (input.daraja !== undefined) {
    const fromEnv: string[] = []

    const consumerKey = resolveCredential(
      input.daraja.consumerKey,
      'LIPAD_DARAJA_CONSUMER_KEY',
      'Daraja consumerKey is required. Pass it to createClient() or set LIPAD_DARAJA_CONSUMER_KEY.',
      fromEnv,
    )
    const consumerSecret = resolveCredential(
      input.daraja.consumerSecret,
      'LIPAD_DARAJA_CONSUMER_SECRET',
      'Daraja consumerSecret is required. Pass it to createClient() or set LIPAD_DARAJA_CONSUMER_SECRET.',
      fromEnv,
    )
    const shortcode = resolveCredential(
      input.daraja.shortcode,
      'LIPAD_DARAJA_SHORTCODE',
      'Daraja shortcode is required. Pass it to createClient() or set LIPAD_DARAJA_SHORTCODE.',
      fromEnv,
    )
    const passkey = resolveCredential(
      input.daraja.passkey,
      'LIPAD_DARAJA_PASSKEY',
      'Daraja passkey is required. Pass it to createClient() or set LIPAD_DARAJA_PASSKEY.',
      fromEnv,
    )

    if (input.env === 'sandbox' && fromEnv.length > 0) {
      console.warn('[lipad] sandbox · daraja credentials resolved from environment')
    }

    resolved.daraja = {
      consumerKey,
      consumerSecret,
      shortcode,
      passkey,
      baseUrl: DARAJA_URLS[input.env],
    }
  }

  // ── Jenga ───────────────────────────────────────────────────────────────────
  if (input.jenga !== undefined) {
    const fromEnv: string[] = []

    const apiKey = resolveCredential(
      input.jenga.apiKey,
      'LIPAD_JENGA_API_KEY',
      'Jenga apiKey is required. Pass it to createClient() or set LIPAD_JENGA_API_KEY.',
      fromEnv,
    )
    const merchantCode = resolveCredential(
      input.jenga.merchantCode,
      'LIPAD_JENGA_MERCHANT_CODE',
      'Jenga merchantCode is required. Pass it to createClient() or set LIPAD_JENGA_MERCHANT_CODE.',
      fromEnv,
    )
    const consumerSecret = resolveCredential(
      input.jenga.consumerSecret,
      'LIPAD_JENGA_CONSUMER_SECRET',
      'Jenga consumerSecret is required. Pass it to createClient() or set LIPAD_JENGA_CONSUMER_SECRET.',
      fromEnv,
    )

    // privateKey is optional — Jenga sandbox can auto-generate it
    const privateKey =
      input.jenga.privateKey ?? process.env['LIPAD_JENGA_PRIVATE_KEY']

    if (input.env === 'sandbox' && fromEnv.length > 0) {
      console.warn('[lipad] sandbox · jenga credentials resolved from environment')
    }

    resolved.jenga = {
      apiKey,
      merchantCode,
      consumerSecret,
      ...(privateKey !== undefined ? { privateKey } : {}),
      baseUrl: JENGA_URLS[input.env],
    }
  }

  // ── Buni ────────────────────────────────────────────────────────────────────
  if (input.buni !== undefined) {
    const fromEnv: string[] = []

    const consumerKey = resolveCredential(
      input.buni.consumerKey,
      'LIPAD_BUNI_CONSUMER_KEY',
      'Buni consumerKey is required. Pass it to createClient() or set LIPAD_BUNI_CONSUMER_KEY.',
      fromEnv,
    )
    const consumerSecret = resolveCredential(
      input.buni.consumerSecret,
      'LIPAD_BUNI_CONSUMER_SECRET',
      'Buni consumerSecret is required. Pass it to createClient() or set LIPAD_BUNI_CONSUMER_SECRET.',
      fromEnv,
    )
    const orgShortCode = resolveCredential(
      input.buni.orgShortCode,
      'LIPAD_BUNI_ORG_SHORT_CODE',
      'Buni orgShortCode is required. Pass it to createClient() or set LIPAD_BUNI_ORG_SHORT_CODE.',
      fromEnv,
    )

    if (input.env === 'sandbox' && fromEnv.length > 0) {
      console.warn('[lipad] sandbox · buni credentials resolved from environment')
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
