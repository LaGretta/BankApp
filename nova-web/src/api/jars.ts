import { api } from '../lib/apiClient'
import type { JarResponse, JarTransaction } from '../lib/types'

export function getJars() {
  return api.get<JarResponse[]>('/api/jars')
}

export function getJar(id: number) {
  return api.get<JarResponse>(`/api/jars/${id}`)
}

export function createJar(input: {
  accountId: number
  name: string
  iconKey: string
  targetAmount: number
  targetDate: string | null
}) {
  // валюта банки успадковується від рахунку — валюту не шлемо
  return api.post<JarResponse>('/api/jars', input)
}

export function depositToJar(id: number, amount: number, idempotencyKey: string) {
  return api.post<JarResponse>(`/api/jars/${id}/deposit`, { amount, idempotencyKey })
}

export function withdrawFromJar(id: number, amount: number, idempotencyKey: string) {
  return api.post<JarResponse>(`/api/jars/${id}/withdraw`, { amount, idempotencyKey })
}

export function closeJar(id: number) {
  return api.post<JarResponse>(`/api/jars/${id}/close`)
}

export function getJarHistory(id: number) {
  return api.get<JarTransaction[]>(`/api/jars/${id}/history`)
}
