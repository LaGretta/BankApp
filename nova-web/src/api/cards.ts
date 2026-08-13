import { api } from '../lib/apiClient'
import { TIER_TO_NUM, type CardTier } from '../lib/enums'
import type { CardCreated, CardResponse } from '../lib/types'

export function getCard(id: number) {
  return api.get<CardResponse>(`/api/cards/${id}`)
}

export function createCard(accountId: number, tier: CardTier) {
  // cardType числом (див. enums.ts — про порожній enum на бекенді)
  return api.post<CardCreated>('/api/cards', {
    accountId,
    cardType: TIER_TO_NUM[tier],
  })
}

export function blockCard(id: number) {
  return api.patch<CardResponse>(`/api/cards/${id}/block`)
}
