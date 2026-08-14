import type { JarResponse } from './types'

/** Відсоток наповнення 0..100 (клієнтське обчислення). */
export function jarPercent(jar: Pick<JarResponse, 'currentAmount' | 'targetAmount'>): number {
  if (!jar.targetAmount || jar.targetAmount <= 0) return 0
  return Math.max(0, Math.min(100, (jar.currentAmount / jar.targetAmount) * 100))
}

/** Стадія 1..5 (яка з 20%-смуг). */
export function jarStage(percent: number): number {
  return Math.min(5, Math.max(1, Math.ceil(percent / 20)))
}

/** Скільки лишилось до цілі. */
export function amountLeft(jar: Pick<JarResponse, 'currentAmount' | 'targetAmount'>): number {
  return Math.max(0, jar.targetAmount - jar.currentAmount)
}

/** Днів до цілі (null, якщо дати немає або вона в минулому). */
export function daysLeft(targetDate: string | null): number | null {
  if (!targetDate) return null
  const d = new Date(targetDate)
  if (Number.isNaN(d.getTime())) return null
  const ms = d.getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / (24 * 3600 * 1000))
}

/** Відмінювання «день/дні/днів». */
export function pluralDays(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'день'
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'дні'
  return 'днів'
}
