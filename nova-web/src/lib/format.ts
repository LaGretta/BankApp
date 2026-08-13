import { CURRENCY_SYMBOL, type CurrencyCode } from './enums'

/** Форматує число з роздільником тисяч і 2 знаками. Напр. 12345.5 → "12 345,50" */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Ціла частина + копійки окремо (для стилізованого балансу). */
export function splitAmount(value: number): { int: string; frac: string } {
  const fixed = Math.abs(value).toFixed(2)
  const [int, frac] = fixed.split('.')
  const intGrouped = new Intl.NumberFormat('uk-UA').format(Number(int))
  return { int: intGrouped, frac }
}

export function symbolFor(currency: string): string {
  return CURRENCY_SYMBOL[currency as CurrencyCode] ?? ''
}

/** Псевдо-IBAN для відображення (реального IBAN бекенд не віддає): UA••3204 */
export function pseudoIban(accountId: number): string {
  return `UA••${String(accountId).padStart(4, '0').slice(-4)}`
}

/** Маскує номер картки, лишаючи 4 останні: •••• •••• •••• 1234 */
export function maskCardNumber(raw: string): string {
  const digits = raw.replace(/\s+/g, '')
  const last4 = digits.slice(-4)
  return `•••• •••• •••• ${last4}`
}

/** Групує повний номер по 4: 1234 5678 9012 3456 */
export function groupCardNumber(raw: string): string {
  const digits = raw.replace(/\s+/g, '')
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export function last4(raw: string): string {
  return raw.replace(/\s+/g, '').slice(-4)
}

/** MM/YY з ISO-дати. */
export function formatExpiry(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '••/••'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}/${yy}`
}

/** Дата+час для деталей транзакції: "13 серп. 2026, 14:32" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Коротка дата для рядків історії: "13 серп." */
export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' }).format(d)
}

export function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}
