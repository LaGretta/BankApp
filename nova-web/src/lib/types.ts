import type { CardTier, CurrencyCode, TxStatus, TxType } from './enums'

/* Форма JSON з бекенду. Enum-и — РЯДКИ (JsonStringEnumConverter). */

export interface AuthResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string // "User" | "Admin"
  createdAt: string
  token: string // короткоживучий access JWT (~30 хв)
  refreshToken: string // довгий opaque refresh-токен (ротується при кожному refresh)
}

export interface CardResponse {
  id: number
  cardType: CardTier // "White" | "Black" | "Platinum"
  number: string // повний номер (маскуємо в UI)
  holderName: string
  expiryDate: string // ISO DateTime
  isActive: boolean
  dailyLimit: number | null // денний ліміт витрат; null = без ліміту
}

/* GET /api/cards/{id}/spent-today */
export interface CardSpentToday {
  spentToday: number
}

/* GET /api/rates/{currency} → скільки UAH за 1 одиницю валюти (UAH = 1) */
export interface RateResponse {
  currency: CurrencyCode
  rateToUah: number
}

/* GET /api/cards/currency-by-number/{cardNumber} */
export interface CardCurrency {
  currency: CurrencyCode
}

/* ---- Loans (Кредити) — усі числа з бекенду, НЕ рахуємо на клієнті ---- */
export type LoanStatus = 'Active' | 'Paid' | 'Overdue'

export interface LoanResponse {
  id: number
  accountId: number
  principal: number
  annualRate: number // напр. 20 (відсоток)
  termMonths: number
  monthlyPayment: number
  remainingBalance: number // залишок до сплати (стартує = totalToRepay)
  currency: CurrencyCode
  status: LoanStatus
  createdAt: string
  nextPaymentDate: string
}

/* POST /api/loans/calculate — прев'ю (нічого не створює) */
export interface LoanCalcResponse {
  monthlyPayment: number
  totalToRepay: number
  totalInterest: number
  annualRate: number
}

/* ---- Analytics ---- */
export type AnalyticsPeriod = 'month' | 'year' | 'all'

export interface AnalyticsResponse {
  totalSpent: number
  totalReceived: number
  net: number
  currency: CurrencyCode // усе конвертовано в UAH на бекенді
  breakdown: { type: string; amount: number }[]
  chart: { label: string; spent: number; received: number }[]
}

/* GET /api/loans/{id}/schedule */
export interface LoanPayment {
  id: number
  dueDate: string
  amount: number
  principalPart: number
  interestPart: number
  isPaid: boolean
  paidAt: string | null
}

/* Повертається ОДИН раз при створенні картки — містить CVV. */
export interface CardCreated {
  id: number
  cardType: CardTier
  number: string
  cvv: string
  holderName: string
  expiryDate: string
}

/* GET /api/cards/{id}/cvv */
export interface CardCvv {
  cvv: string
}

export interface AccountResponse {
  id: number
  currency: CurrencyCode
  balance: number
  cards: CardResponse[]
}

export interface TransactionResponse {
  id: number
  fromAccountId: number | null
  toAccountId: number | null
  amount: number
  currency: CurrencyCode
  type: TxType
  status: TxStatus
  description: string
  createdAt: string
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/* ---- Jars (Накопичення) ---- */
export interface JarResponse {
  id: number
  accountId: number
  name: string
  iconKey: string
  targetAmount: number
  currentAmount: number
  currency: CurrencyCode
  targetDate: string | null
  isClosed: boolean
  createdAt: string
}

export interface JarTransaction {
  id: number
  amount: number
  type: 'Deposit' | 'Withdraw'
  createdAt: string
}

/* ASP.NET ProblemDetails */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
