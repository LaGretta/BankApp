/* ==========================================================================
   Enum-и. Бекенд тепер серіалізує enum РЯДКАМИ (JsonStringEnumConverter):
   currency "UAH"/"USD"/"EUR", cardType "White"/"Black"/"Platinum",
   transaction type "Transfer"/"TopUp"/..., status "Pending"/"Completed"/"Failed".
   Тут — типи + людські підписи. Значення = рядок з бекенду напряму.
   ========================================================================== */

/* ---- Currency ---- */
export type CurrencyCode = 'UAH' | 'USD' | 'EUR'
export const CURRENCIES: CurrencyCode[] = ['UAH', 'USD', 'EUR']
export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = { UAH: '₴', USD: '$', EUR: '€' }
export const CURRENCY_NAME: Record<CurrencyCode, string> = {
  UAH: 'Гривня',
  USD: 'Долар',
  EUR: 'Євро',
}

/* ---- Card tier ---- */
export type CardTier = 'White' | 'Black' | 'Platinum'
export const TIERS: CardTier[] = ['White', 'Black', 'Platinum']
export const TIER_LABEL: Record<CardTier, string> = {
  White: 'Nova White',
  Black: 'Nova Black',
  Platinum: 'Nova Platinum',
}

/* ---- Transaction type ---- */
export type TxType = 'Transfer' | 'TopUp' | 'Payment' | 'Withdrawal'
export const TXTYPE_LABEL: Record<TxType, string> = {
  Transfer: 'Переказ',
  TopUp: 'Поповнення',
  Payment: 'Оплата',
  Withdrawal: 'Зняття',
}

/* ---- Transaction status ---- */
export type TxStatus = 'Pending' | 'Completed' | 'Failed'
export const TXSTATUS_LABEL: Record<TxStatus, string> = {
  Pending: 'В обробці',
  Completed: 'Виконано',
  Failed: 'Відхилено',
}

/* безпечні хелпери підписів (на випадок несподіваного значення з бекенду) */
export const currencyName = (c: string) => CURRENCY_NAME[c as CurrencyCode] ?? c
export const currencySymbol = (c: string) => CURRENCY_SYMBOL[c as CurrencyCode] ?? ''
export const tierLabel = (t: string) => TIER_LABEL[t as CardTier] ?? t
export const txTypeLabel = (t: string) => TXTYPE_LABEL[t as TxType] ?? t
export const txStatusLabel = (s: string) => TXSTATUS_LABEL[s as TxStatus] ?? s
