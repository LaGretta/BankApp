import { api } from '../lib/apiClient'
import type { LoanCalcResponse, LoanPayment, LoanResponse } from '../lib/types'

/** Прев'ю розрахунку (annuity рахує БЕКЕНД — ніколи не клієнт). */
export function calculateLoan(principal: number, termMonths: number) {
  return api.post<LoanCalcResponse>('/api/loans/calculate', { principal, termMonths })
}

/** Взяти кредит — тіло зараховується на обраний рахунок. */
export function takeLoan(input: { accountId: number; principal: number; termMonths: number }) {
  return api.post<LoanResponse>('/api/loans', input)
}

export function getLoans() {
  return api.get<LoanResponse[]>('/api/loans')
}

export function getLoan(id: number) {
  return api.get<LoanResponse>(`/api/loans/${id}`)
}

export function getLoanSchedule(id: number) {
  return api.get<LoanPayment[]>(`/api/loans/${id}/schedule`)
}

/** Сплатити наступний платіж (списує monthlyPayment з рахунку кредиту). */
export function payLoan(id: number) {
  return api.post<LoanResponse>(`/api/loans/${id}/pay`)
}
