/* GUID для idempotencyKey.
   Правило контракту: НОВА операція → новий ключ; RETRY тієї самої операції →
   той самий ключ (щоб бекенд дедуплікував). Хук useIdempotencyKey тримає ключ
   між ретраями, і скидає його після успіху / нової операції. */

export function newGuid(): string {
  // crypto.randomUUID доступний у всіх сучасних браузерах (secure context / localhost)
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // запасний варіант
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
