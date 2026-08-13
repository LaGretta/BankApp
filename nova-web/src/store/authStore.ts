import { create } from 'zustand'
import { setAuthToken } from '../lib/apiClient'
import type { AuthResponse } from '../lib/types'

const TOKEN_KEY = 'nova.token'
const USER_KEY = 'nova.user'

export interface AuthUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: number
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthed: boolean
  setAuth: (res: AuthResponse) => void
  logout: () => void
}

/* --- відновлення сесії з localStorage при завантаженні --- */
function restore(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const rawUser = localStorage.getItem(USER_KEY)
    const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null
    if (token) setAuthToken(token)
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

const initial = restore()

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  user: initial.user,
  isAuthed: !!initial.token,

  setAuth: (res) => {
    const user: AuthUser = {
      id: res.id,
      firstName: res.firstName,
      lastName: res.lastName,
      email: res.email,
      role: res.role,
    }
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setAuthToken(res.token)
    set({ token: res.token, user, isAuthed: true })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAuthToken(null)
    set({ token: null, user: null, isAuthed: false })
  },
}))

/** Викликати з apiClient при 401. */
export function forceLogout() {
  useAuthStore.getState().logout()
}
