import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/apiClient'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: (opts?: { silent?: boolean }) => Promise<void>
  setData: (d: T) => void
}

/* Генеричний завантажувач: loading/error/reload. silent=true — без скелета (pull-to-refresh). */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true)
      setError(null)
      try {
        const res = await fn()
        setData(res)
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return // 401 → редірект робить apiClient
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  )

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, reload, setData }
}
