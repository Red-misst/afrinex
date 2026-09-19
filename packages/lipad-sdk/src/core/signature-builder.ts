import forge from 'node-forge'

/**
 * RSA-SHA256 signature builder for Jenga API authentication.
 *
 * Signs a payload with a private key and returns request headers
 * containing the Api-Key and a Bearer-token signature.
 */
export class SignatureBuilder {
  private privateKeyPem: string

  constructor(opts: { privateKeyPem: string }) {
    this.privateKeyPem = opts.privateKeyPem
  }

  sign(signingPayload: string): string {
    const privateKey = forge.pki.privateKeyFromPem(this.privateKeyPem)
    const md = forge.md.sha256.create()
    md.update(signingPayload, 'utf8')
    return forge.util.encode64(privateKey.sign(md))
  }
}
