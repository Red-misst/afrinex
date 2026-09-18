import fs from 'node:fs'
import path from 'node:path'
import forge from 'node-forge'
import { SignatureBuilder } from '../../core/signature-builder'
import { ConfigurationError } from '../../errors/config-error'
import type { ResolvedJengaConfig } from '../../types/config'
import type { AuthStrategy, AuthContext, Environment } from '../../types/provider'

const SANDBOX_KEY_PATH = path.join(process.cwd(), '.lipad', 'jenga_sandbox.pem')

/**
 * Creates the Jenga RSA-SHA256 AuthStrategy.
 *
 * Sandbox: auto-generates a 2048-bit RSA keypair if no privateKey is provided.
 *   - Saves private key to .lipad/jenga_sandbox.pem
 *   - Prints public key to console for developer portal registration
 *
 * Production: privateKey is required (PEM string or base64-encoded PEM).
 */
export function createJengaAuth(
  config: ResolvedJengaConfig,
  env: Environment,
): AuthStrategy {
  const privateKeyPem = resolvePrivateKey(config, env)

  const signatureBuilder = new SignatureBuilder({
    privateKeyPem,
    apiKey: config.apiKey,
  })

  return {
    async headers(context?: AuthContext): Promise<Record<string, string>> {
      return signatureBuilder.headers(context?.signingPayload ?? '')
    },
  }
}

function resolvePrivateKey(config: ResolvedJengaConfig, env: Environment): string {
  // If a key was explicitly provided, check if it's base64 and decode if needed
  if (config.privateKey !== undefined && config.privateKey !== '') {
    return decodeKey(config.privateKey)
  }

  if (env === 'production') {
    throw new ConfigurationError(
      'Jenga privateKey is required in production. Pass it to createClient() as a PEM string or set LIPAD_JENGA_PRIVATE_KEY as a base64-encoded PEM.'
    )
  }

  // Sandbox: try to load an existing generated key
  if (fs.existsSync(SANDBOX_KEY_PATH)) {
    return fs.readFileSync(SANDBOX_KEY_PATH, 'utf8')
  }

  // Generate a new 2048-bit RSA keypair
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 })
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey)
  const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey)

  // Save private key
  const dir = path.dirname(SANDBOX_KEY_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(SANDBOX_KEY_PATH, privateKeyPem, { encoding: 'utf8', mode: 0o600 })

  console.log('\n[lipad] Jenga sandbox RSA keypair generated.')
  console.log('[lipad] Paste this public key into your Jenga developer portal:\n')
  console.log(publicKeyPem)
  console.log('\n[lipad] Private key saved to .lipad/jenga_sandbox.pem\n')

  return privateKeyPem
}

/** Detects base64-encoded PEM (no -----BEGIN header) and decodes it */
function decodeKey(key: string): string {
  if (key.includes('-----BEGIN')) {
    return key
  }
  return Buffer.from(key, 'base64').toString('utf8')
}
