import { api } from '../lib/apiClient'
import type { AnalyticsPeriod, AnalyticsResponse } from '../lib/types'

/** Аналітика за період (усі суми вже в UAH — бекенд конвертує). */
export function getAnalytics(period: AnalyticsPeriod) {
  return api.get<AnalyticsResponse>('/api/analytics', { period })
}
