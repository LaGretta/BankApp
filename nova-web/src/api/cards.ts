import { api } from '../lib/apiClient'
import type { CardTier } from '../lib/enums'
import type { CardCreated, CardCvv, CardResponse, CardSpentToday } from '../lib/types'

export function getCard(id: number) {
  return api.get<CardResponse>(`/api/cards/${id}`)
}

export function createCard(accountId: number, tier: CardTier) {
  // cardType рядком
  return api.post<CardCreated>('/api/cards', { accountId, cardType: tier })
}

export function blockCard(id: number) {
  return api.patch<CardResponse>(`/api/cards/${id}/block`)
}

/** CVV тягнемо ЛИШЕ на вимогу користувача (тап «показати»), не наперед. */
export function getCardCvv(id: number) {
  return api.get<CardCvv>(`/api/cards/${id}/cvv`)
}

/** Встановити (число) або зняти (null) денний ліміт витрат картки. */
export function setCardLimit(id: number, dailyLimit: number | null) {
  return api.patch<CardResponse>(`/api/cards/${id}/limit`, { dailyLimit })
}

/** Витрачено сьогодні за карткою (для бару лімітів). */
export function getCardSpentToday(id: number) {
  return api.get<CardSpentToday>(`/api/cards/${id}/spent-today`)
}
