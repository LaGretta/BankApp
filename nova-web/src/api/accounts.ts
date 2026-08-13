import { api } from '../lib/apiClient'
import { CURRENCY_TO_NUM, type CurrencyCode } from '../lib/enums'
import type { AccountResponse } from '../lib/types'

export function getAccounts() {
  return api.get<AccountResponse[]>('/api/accounts')
}

export function getAccount(id: number) {
  return api.get<AccountResponse>(`/api/accounts/${id}`)
}

export function createAccount(currency: CurrencyCode) {
  // enum по дроту — числом (бекенд без JsonStringEnumConverter)
  return api.post<AccountResponse>('/api/accounts', { currency: CURRENCY_TO_NUM[currency] })
}
