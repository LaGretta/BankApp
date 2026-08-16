import { getRate } from '../api/rates'
import type { CurrencyCode } from './enums'

export interface CachedRate {
  rate: number // UAH за 1 одиницю валюти
  fetchedAt: number
}

/* Кеш курсів на сесію + дедуплікація паралельних запитів. */
const cache = new Map<CurrencyCode, CachedRate>()
const inflight = new Map<CurrencyCode, Promise<CachedRate>>()

export function cachedRate(c: CurrencyCode): CachedRate | null {
  if (c === 'UAH') return { rate: 1, fetchedAt: Date.now() }
  return cache.get(c) ?? null
}

export function fetchRate(c: CurrencyCode): Promise<CachedRate> {
  if (c === 'UAH') return Promise.resolve({ rate: 1, fetchedAt: Date.now() })
  const hit = cache.get(c)
  if (hit) return Promise.resolve(hit)
  const existing = inflight.get(c)
  if (existing) return existing
  const p = getRate(c)
    .then((r) => {
      const val: CachedRate = { rate: r.rateToUah, fetchedAt: Date.now() }
      cache.set(c, val)
      inflight.delete(c)
      return val
    })
    .catch((e) => {
      inflight.delete(c)
      throw e
    })
  inflight.set(c, p)
  return p
}

/** Конвертація amount (у валюті src) → у валюту dst через курси до UAH. */
export function convert(amount: number, srcRate: number, dstRate: number): number {
  if (!dstRate) return 0
  return (amount * srcRate) / dstRate
}

/** «щойно» / «N хв тому» / «N год тому» для мітки оновлення. */
export function ageLabel(fetchedAt: number): string {
  const mins = Math.floor((Date.now() - fetchedAt) / 60000)
  if (mins < 1) return 'щойно'
  if (mins < 60) return `${mins} хв тому`
  const h = Math.floor(mins / 60)
  return `${h} год тому`
}
