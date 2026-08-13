import type { CardTier, CurrencyCode, TxStatus, TxType } from './enums'

/* Форма JSON з бекенду. Enum-и — РЯДКИ (JsonStringEnumConverter). */

export interface AuthResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string // "User" | "Admin"
  createdAt: string
  token: string
}

export interface CardResponse {
  id: number
  cardType: CardTier // "White" | "Black" | "Platinum"
  number: string // повний номер (маскуємо в UI)
  holderName: string
  expiryDate: string // ISO DateTime
  isActive: boolean
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

/* ASP.NET ProblemDetails */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
