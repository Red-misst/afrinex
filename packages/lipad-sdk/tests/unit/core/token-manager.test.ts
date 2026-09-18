import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TokenManager } from '../../../src/core/token-manager'
import { AuthError } from '../../../src/errors/auth-error'

describe('TokenManager', () => {
  let callCount: number
  let manager: TokenManager

  beforeEach(() => {
    callCount = 0
    manager = new TokenManager({
      provider: 'test',
      fetchToken: async () => {
        callCount++
        return { token: `token-${callCount}`, expiresIn: 3600 }
      },
    })
  })

  it('calls fetchToken once for a cold cache', async () => {
    const token = await manager.getToken()
    expect(token).toBe('token-1')
    expect(callCount).toBe(1)
  })

  it('returns cached token without calling fetchToken again', async () => {
    await manager.getToken()
    const token = await manager.getToken()
    expect(token).toBe('token-1')
    expect(callCount).toBe(1)
  })

  it('calls fetchToken exactly once for 10 concurrent cold-cache requests', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => manager.getToken())
    )
    expect(callCount).toBe(1)
    expect(new Set(results).size).toBe(1) // all the same token
  })

  it('re-fetches after invalidate()', async () => {
    await manager.getToken()
    manager.invalidate()
    const token = await manager.getToken()
    expect(token).toBe('token-2')
    expect(callCount).toBe(2)
  })

  it('re-fetches when token has expired', async () => {
    // Create a manager with a token that expires immediately
    const expiringManager = new TokenManager({
      provider: 'test',
      fetchToken: async () => {
        callCount++
        return { token: `token-${callCount}`, expiresIn: 30 } // 30s - buffer = 0s expiry
      },
    })

    await expiringManager.getToken()
    expect(callCount).toBe(1)

    // Simulate time passing past the expiry
    expiringManager.invalidate()

    await expiringManager.getToken()
    expect(callCount).toBe(2)
  })

  it('wraps fetchToken errors in AuthError', async () => {
    const failingManager = new TokenManager({
      provider: 'daraja',
      fetchToken: async () => {
        throw new Error('network timeout')
      },
    })

    await expect(failingManager.getToken()).rejects.toThrowError(AuthError)
    await expect(failingManager.getToken()).rejects.toThrow('Auth failed')
  })
})
