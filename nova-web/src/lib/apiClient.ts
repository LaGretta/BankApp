import type { ProblemDetails } from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5203').replace(/\/$/, '')

/* --- access-токен тримаємо тут, щоб уникнути циклічних залежностей зі стором --- */
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

/* Хендлери авторизації (реєструє main.tsx → зв'язує зі стором). */
interface AuthHandlers {
  getRefreshToken: () => string | null
  onTokensRefreshed: (res: { token: string; refreshToken: string }) => void
  onRefreshFailed: () => void
}
let handlers: AuthHandlers | null = null
export function registerAuthHandlers(h: AuthHandlers) {
  handlers = h
}

export class ApiError extends Error {
  status: number
  detail: string
  problem?: ProblemDetails
  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = message
    this.problem = problem
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | number | undefined>
  signal?: AbortSignal
  /** внутрішнє: запит уже повторено після refresh (щоб не зациклитись) */
  _retried?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(BASE_URL + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

/* ==========================================================================
   Тихий refresh. ЄДИНИЙ in-flight проміс: усі паралельні 401 чекають на ОДИН
   виклик /api/auth/refresh, тоді повторюють свої запити (без «refresh storm»).
   ========================================================================== */
let refreshPromise: Promise<boolean> | null = null

async function performRefresh(): Promise<boolean> {
  const rt = handlers?.getRefreshToken() ?? null
  if (!rt) return false
  try {
    // «сирий» fetch — НЕ через request(), щоб не тригерити інтерсептор рекурсивно
    const res = await fetch(BASE_URL + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { token?: string; refreshToken?: string }
    if (!data?.token || !data?.refreshToken) return false
    authToken = data.token
    // ротація: зберігаємо НОВИЙ token + НОВИЙ refreshToken
    handlers?.onTokensRefreshed({ token: data.token, refreshToken: data.refreshToken })
    return true
  } catch {
    return false
  }
}

function doRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, 'Немає з’єднання із сервером. Перевір, чи запущений бекенд.')
  }

  // 401 на АВТОРИЗОВАНОМУ запиті → тихий refresh + одна спроба повтору.
  // (401 без access-токена — логін/реєстрація — сюди не потрапляє: там показуємо
  //  «Невірний email або пароль»; сесія ще не існує.)
  if (res.status === 401 && authToken) {
    if (!opts._retried && (await doRefresh())) {
      return request<T>(path, { ...opts, _retried: true })
    }
    // refresh не вдався (протух/відкликаний) або новий токен теж 401 → на логін з банером
    handlers?.onRefreshFailed()
    throw new ApiError(401, 'Сесія завершилась. Увійдіть знову.')
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? safeJson(text) : null

  if (!res.ok) {
    const problem = (data ?? {}) as ProblemDetails
    const detail =
      problem.detail || problem.title || firstValidationError(problem) || `Помилка ${res.status}`
    throw new ApiError(res.status, detail, problem)
  }

  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return { detail: text }
  }
}

function firstValidationError(problem: ProblemDetails): string | null {
  if (problem.errors) {
    const first = Object.values(problem.errors)[0]
    if (first && first.length) return first[0]
  }
  return null
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'PATCH', body, signal }),
}

export { BASE_URL }
