import forge from 'node-forge'

/**
 * RSA-SHA256 signature builder for Jenga API authentication.
 *
 * Signs a payload with a private key and returns request headers
 * containing the Api-Key and a Bearer-token signature.
 */
export class SignatureBuilder {
  private privateKeyPem: string
  private apiKey: string

  constructor(opts: { privateKeyPem: string; apiKey: string }) {
    this.privateKeyPem = opts.privateKeyPem
    this.apiKey = opts.apiKey
  }

  headers(signingPayload: string): Record<string, string> {
    const privateKey = forge.pki.privateKeyFromPem(this.privateKeyPem)
    const md = forge.md.sha256.create()
    md.update(signingPayload, 'utf8')
    const signature = forge.util.encode64(privateKey.sign(md))

    return {
      'Api-Key': this.apiKey,
      'Authorization': `Bearer ${signature}`,
      'Content-Type': 'application/json',
    }
  }
}
