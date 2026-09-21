import * as crypto from 'crypto'
import * as fs from 'fs'

export function generateSecurityCredential(password?: string, certPath?: string): string {
  if (!password) {
    throw new Error('initiatorPassword is required in config for B2C transfers')
  }
  if (!certPath) {
    throw new Error('certPath is required in config for B2C transfers to encrypt the initiator password')
  }
  
  if (!fs.existsSync(certPath)) {
    throw new Error(`Safaricom public certificate not found at path: ${certPath}`)
  }

  const cert = fs.readFileSync(certPath, 'utf8')
  
  const encrypted = crypto.publicEncrypt(
    {
      key: cert,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(password)
  )
  
  return encrypted.toString('base64')
}
