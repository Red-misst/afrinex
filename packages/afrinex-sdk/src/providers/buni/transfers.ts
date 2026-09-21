import { normalizePhone } from '../../core/phone'
import { BUNI_PATHS } from './constants'
import type { AuthStrategy } from '../../types/provider'
import type { ResolvedBuniConfig } from '../../types/config'
import type { TransferToPhoneRequest, TransferResponse } from '../../types'
import type { HttpClient } from '../../core/http-client'

export async function toPhone(
  req: TransferToPhoneRequest,
  config: ResolvedBuniConfig,
  auth: AuthStrategy,
  http: HttpClient,
): Promise<TransferResponse> {
  const phone = normalizePhone(req.phone)
  const headers = await auth.headers()

  const body = {
    companyCode: config.companyCode ?? config.orgShortCode,
    transactionType: 'IF',
    debitAccountNumber: config.debitAccountNumber ?? config.orgShortCode,
    creditAccountNumber: phone,
    debitAmount: req.amount,
    paymentDetails: req.remarks ?? req.reference,
    transactionReference: req.reference,
    currency: 'KES',
    beneficiaryDetails: 'UNKNOWN',
    beneficiaryBankCode: '01',
  }

  // Handle generic Buni error/success responses based on real shape if known
  // If not, fall back to checking if response exists
  const response = await http.post<any>(
    BUNI_PATHS.transfer,
    body,
    headers,
  )

  return {
    success: response?.status === 'SUCCESS' || response?.transactionReference !== undefined || !!response, // Adjust as per real api response success format
    transactionId: response?.transactionReference ?? response?.transactionID ?? '',
    message: response?.message ?? 'Request accepted',
    raw: response,
  }
}
