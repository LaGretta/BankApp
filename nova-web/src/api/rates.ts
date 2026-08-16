import { api } from '../lib/apiClient'
import type { CurrencyCode } from '../lib/enums'
import type { RateResponse } from '../lib/types'

/** Курс валюти до UAH (скільки гривень за 1 одиницю). UAH → 1. */
export function getRate(currency: CurrencyCode) {
  return api.get<RateResponse>(`/api/rates/${currency}`)
}
