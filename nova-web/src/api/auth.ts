import { api } from '../lib/apiClient'
import type { AuthResponse } from '../lib/types'

export function login(email: string, password: string) {
  return api.post<AuthResponse>('/api/auth/login', { email, password })
}

export function register(input: {
  firstName: string
  lastName: string
  email: string
  password: string
}) {
  return api.post<AuthResponse>('/api/auth/register', input)
}
