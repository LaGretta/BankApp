import { BASE_URL, api } from '../lib/apiClient'
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

/**
 * Відкликати refresh-токен при ручному виході.
 * «Сирий» fetch (не через api client), щоб протухлий access не тригерив
 * silent-refresh під час логауту. Best-effort — помилки ковтаємо.
 */
export async function authLogout(refreshToken: string) {
  await fetch(BASE_URL + '/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}
