import axios, { type AxiosInstance } from 'axios'
import { ProviderError } from '../errors/provider-error'

/**
 * Thin axios wrapper that converts non-2xx responses to ProviderError.
 * Exposes this.axios for test interception via axios-mock-adapter.
 */
export class HttpClient {
  readonly axios: AxiosInstance

  constructor(private baseUrl: string) {
    this.axios = axios.create({ baseURL: baseUrl })
  }

  async get<T>(path: string, headers: Record<string, string>): Promise<T> {
    try {
      const response = await this.axios.get<T>(path, { headers })
      return response.data
    } catch (err) {
      throw this.toProviderError(err)
    }
  }

  async post<T>(
    path: string,
    body: unknown,
    headers: Record<string, string>
  ): Promise<T> {
    try {
      const response = await this.axios.post<T>(path, body, { headers })
      return response.data
    } catch (err) {
      throw this.toProviderError(err)
    }
  }

  private toProviderError(err: unknown): ProviderError {
    if (axios.isAxiosError(err) && err.response) {
      const raw = err.response.data as unknown
      // Try to extract a meaningful provider-native code from the response body
      const body = raw as Record<string, unknown>
      const providerCode =
        (typeof body?.['errorCode'] === 'string' ? body['errorCode'] : undefined) ??
        (typeof body?.['ResponseCode'] === 'string' ? body['ResponseCode'] : undefined) ??
        (typeof body?.['code'] === 'string' ? body['code'] : undefined) ??
        String(err.response.status)

      const providerMessage =
        (typeof body?.['errorMessage'] === 'string' ? body['errorMessage'] : undefined) ??
        (typeof body?.['ResponseDescription'] === 'string' ? body['ResponseDescription'] : undefined) ??
        (typeof body?.['message'] === 'string' ? body['message'] : undefined) ??
        err.message

      return new ProviderError({
        provider: new URL(this.baseUrl).hostname,
        providerCode,
        providerMessage,
        raw,
      })
    }

    // Network errors or unexpected throws
    return new ProviderError({
      provider: this.baseUrl,
      providerCode: 'NETWORK_ERROR',
      providerMessage: err instanceof Error ? err.message : String(err),
      raw: err,
    })
  }
}
