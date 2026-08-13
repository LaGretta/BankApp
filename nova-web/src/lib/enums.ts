/* ==========================================================================
   Enum-мапи. ВАЖЛИВО: бекенд без JsonStringEnumConverter → enum'и по дроту
   передаються ЧИСЛАМИ (і в запиті, і у відповіді). Тут єдине джерело правди.
   Порядок значень = порядок оголошення в C# enum.
   ========================================================================== */

/* ---- Currency: enum Currency { UAH, USD, EUR } ---- */
export type CurrencyCode = 'UAH' | 'USD' | 'EUR'
export const CURRENCY_TO_NUM: Record<CurrencyCode, number> = { UAH: 0, USD: 1, EUR: 2 }
export const NUM_TO_CURRENCY: Record<number, CurrencyCode> = { 0: 'UAH', 1: 'USD', 2: 'EUR' }

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
}
export const CURRENCY_NAME: Record<CurrencyCode, string> = {
  UAH: 'Гривня',
  USD: 'Долар',
  EUR: 'Євро',
}

/* ---- Card tier ----
   УВАГА: у бекенді enum CardType ПОРОЖНІЙ. Ми шлемо числа 0/1/2, а бекенд
   (System.Text.Json) допускає невизначені числові значення enum. Порядок —
   наша домовленість: White=0, Black=1, Platinum=2. Див. README, розділ «Бекенд». */
export type CardTier = 'White' | 'Black' | 'Platinum'
export const TIER_TO_NUM: Record<CardTier, number> = { White: 0, Black: 1, Platinum: 2 }
export const NUM_TO_TIER: Record<number, CardTier> = { 0: 'White', 1: 'Black', 2: 'Platinum' }
export const TIERS: CardTier[] = ['White', 'Black', 'Platinum']
export const TIER_LABEL: Record<CardTier, string> = {
  White: 'Nova White',
  Black: 'Nova Black',
  Platinum: 'Nova Platinum',
}

/* ---- TransactionType: { Transfer, TopUp, Payment, Withdrawal } ---- */
export type TxType = 'Transfer' | 'TopUp' | 'Payment' | 'Withdrawal'
export const NUM_TO_TXTYPE: Record<number, TxType> = {
  0: 'Transfer',
  1: 'TopUp',
  2: 'Payment',
  3: 'Withdrawal',
}
export const TXTYPE_LABEL: Record<TxType, string> = {
  Transfer: 'Переказ',
  TopUp: 'Поповнення',
  Payment: 'Оплата',
  Withdrawal: 'Зняття',
}

/* ---- TransactionStatus: { Pending, Completed, Failed } ---- */
export type TxStatus = 'Pending' | 'Completed' | 'Failed'
export const NUM_TO_TXSTATUS: Record<number, TxStatus> = {
  0: 'Pending',
  1: 'Completed',
  2: 'Failed',
}
export const TXSTATUS_LABEL: Record<TxStatus, string> = {
  Pending: 'В обробці',
  Completed: 'Виконано',
  Failed: 'Відхилено',
}
