import { ConfigurationError } from '../errors/config-error'

/**
 * Normalizes a Kenyan phone number to the international format 2547XXXXXXXX.
 *
 * Accepted formats:
 *   07XXXXXXXX   → 2547XXXXXXXX
 *   +2547XXXXXXXX → 2547XXXXXXXX
 *   2547XXXXXXXX  → 2547XXXXXXXX (already correct)
 *
 * @throws {ConfigurationError} if the number cannot be normalized to a valid Kenyan number
 */
export function normalizePhone(phone: string): string {
  const original = phone
  // Strip all whitespace and hyphens
  let cleaned = phone.replace(/[\s-]/g, '')

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  }

  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    cleaned = '254' + cleaned.slice(1)
  }

  // Validate: must be exactly 12 chars starting with 254
  if (cleaned.length !== 12 || !cleaned.startsWith('254')) {
    throw new ConfigurationError(
      `Invalid phone number: "${original}". Expected Kenyan number in format 07XX, +2547XX, or 2547XX.`
    )
  }

  return cleaned
}
