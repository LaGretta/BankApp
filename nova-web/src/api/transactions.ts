import { api } from '../lib/apiClient'
import type { Paged, TransactionResponse } from '../lib/types'

export function getHistory(page: number, pageSize = 20) {
  return api.get<Paged<TransactionResponse>>('/api/transactions', { page, pageSize })
}

export function getTransaction(id: number) {
  return api.get<TransactionResponse>(`/api/transactions/${id}`)
}

/** ПЕРВИННИЙ переказ — за номером картки отримувача (monobank-style). */
export function transferByCard(input: {
  fromAccountId: number
  cardNumber: string // тільки цифри, 16
  amount: number
  description: string
  idempotencyKey: string
}) {
  return api.post<TransactionResponse>('/api/transactions/transfer-by-card', input)
}

/** Вторинний — між своїми рахунками. */
export function transfer(input: {
  fromAccountId: number
  toAccountId: number
  amount: number
  description: string
  idempotencyKey: string
}) {
  return api.post<TransactionResponse>('/api/transactions/transfer', input)
}

export function topUp(input: { cardNumber: string; amount: number; idempotencyKey: string }) {
  return api.post<TransactionResponse>('/api/transactions/topup', input)
}
