import { toast } from '../store/toastStore'

/*
  Копіювання в буфер з коректною обробкою помилок.
  navigator.clipboard недоступний на http (не-localhost) або може кинути — тоді
  пробуємо legacy execCommand, і лише якщо все впало — показуємо помилку.
*/
export async function copyToClipboard(text: string, successMsg = 'Скопійовано') {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      toast.success(successMsg)
      return true
    }
    throw new Error('clipboard API unavailable')
  } catch {
    if (legacyCopy(text)) {
      toast.success(successMsg)
      return true
    }
    toast.error('Не вдалося скопіювати')
    return false
  }
}

function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    ta.style.pointerEvents = 'none'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
