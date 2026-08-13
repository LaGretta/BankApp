/* Форма JSON з бекенду (прочитана з DTO — НЕ змінювати без зміни контракту). */

export interface AuthResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  role: number // enum Role як число
  createdAt: string
  token: string
}

export interface CardResponse {
  id: number
  cardType: number // enum CardType як число
  number: string // повний номер (маскуємо в UI)
  holderName: string
  expiryDate: string // ISO DateTime
  isActive: boolean
}

/* Повертається ОДИН раз при створенні картки — містить CVV. */
export interface CardCreated {
  id: number
  cardType: number
  number: string
  cvv: string
  holderName: string
  expiryDate: string
}

export interface AccountResponse {
  id: number
  currency: number // enum Currency як число
  balance: number
  cards: CardResponse[]
}

export interface TransactionResponse {
  id: number
  fromAccountId: number | null
  toAccountId: number | null
  amount: number
  currency: number
  type: number
  status: number
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
