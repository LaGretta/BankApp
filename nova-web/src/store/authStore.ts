import { create } from 'zustand'
import { authLogout } from '../api/auth'
import { setAuthToken } from '../lib/apiClient'
import type { AuthResponse } from '../lib/types'

const TOKEN_KEY = 'nova.token'
const REFRESH_KEY = 'nova.refresh'
const USER_KEY = 'nova.user'

export interface AuthUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthed: boolean
  sessionExpired: boolean // сесія протухла (банер на логіні), НЕ ручний вихід
  setAuth: (res: AuthResponse) => void
  /** ротація токенів після успішного refresh (не чіпає user/sessionExpired) */
  updateTokens: (t: { token: string; refreshToken: string }) => void
  /** ручний вихід: відкликати refresh на бекенді, тоді очистити (без банера) */
  logoutAsync: () => Promise<void>
  logout: () => void
  /** тихий refresh не вдався → очистити + показати банер */
  expireSession: () => void
  clearSessionExpired: () => void
}

/* --- відновлення сесії з localStorage при завантаженні --- */
function restore(): { token: string | null; refreshToken: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    const rawUser = localStorage.getItem(USER_KEY)
    const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null
    if (token) setAuthToken(token)
    return { token, refreshToken, user }
  } catch {
    return { token: null, refreshToken: null, user: null }
  }
}

function persistTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_KEY, refreshToken)
  setAuthToken(token)
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  setAuthToken(null)
}

const initial = restore()

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initial.token,
  refreshToken: initial.refreshToken,
  user: initial.user,
  isAuthed: !!initial.token,
  sessionExpired: false,

  setAuth: (res) => {
    const user: AuthUser = {
      id: res.id,
      firstName: res.firstName,
      lastName: res.lastName,
      email: res.email,
      role: res.role,
    }
    persistTokens(res.token, res.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token: res.token, refreshToken: res.refreshToken, user, isAuthed: true, sessionExpired: false })
  },

  // ротація: новий access + новий refresh (старий уже відкликано бекендом)
  updateTokens: ({ token, refreshToken }) => {
    persistTokens(token, refreshToken)
    set({ token, refreshToken })
  },

  // ручний вихід — best-effort revoke на бекенді, тоді очистити (без банера)
  logoutAsync: async () => {
    const rt = get().refreshToken
    if (rt) {
      try {
        await authLogout(rt)
      } catch {
        /* навіть якщо revoke не вдався — все одно виходимо локально */
      }
    }
    get().logout()
  },

  logout: () => {
    clearStorage()
    set({ token: null, refreshToken: null, user: null, isAuthed: false, sessionExpired: false })
  },

  expireSession: () => {
    clearStorage()
    set({ token: null, refreshToken: null, user: null, isAuthed: false, sessionExpired: true })
  },

  clearSessionExpired: () => set({ sessionExpired: false }),
}))
