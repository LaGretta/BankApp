import { useCallback, useEffect, useState } from 'react'
import { getHistory } from '../api/transactions'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PullToRefresh } from '../components/PullToRefresh'
import { RowSkeleton } from '../components/Skeleton'
import { TopBar } from '../components/TopBar'
import { TransactionRow } from '../components/TransactionRow'
import { ApiError } from '../lib/apiClient'
import { formatDateShort } from '../lib/format'
import type { TransactionResponse } from '../lib/types'

const PAGE_SIZE = 20

export function History() {
  const [items, setItems] = useState<TransactionResponse[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p: number, mode: 'replace' | 'append' | 'silent') => {
    if (mode === 'append') setLoadingMore(true)
    else if (mode !== 'silent') setLoading(true)
    setError(null)
    try {
      const res = await getHistory(p, PAGE_SIZE)
      setTotal(res.totalCount)
      setPage(res.page)
      setItems((prev) => (mode === 'append' ? [...prev, ...res.items] : res.items))
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    load(1, 'replace')
  }, [load])

  const refresh = useCallback(async () => {
    await load(1, 'silent')
  }, [load])

  const hasMore = items.length < total

  return (
    <PullToRefresh onRefresh={refresh}>
      <TopBar
        title="Історія"
        subtitle={total > 0 ? `${total} ${pluralOps(total)}` : undefined}
      />

      {loading ? (
        <div className="surface" style={{ padding: '4px 14px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Не вдалося завантажити" subtitle={error} action={<Button fullWidth onClick={() => load(1, 'replace')}>Повторити</Button>} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Операцій ще немає"
          subtitle="Тут зʼявляться ваші перекази та поповнення."
        />
      ) : (
        <>
          <div className="surface" style={{ padding: '2px 14px' }}>
            {groupByDay(items).map((group) => (
              <div key={group.day}>
                <p className="mono-cap" style={{ padding: '14px 2px 6px' }}>
                  {group.day}
                </p>
                {group.items.map((tx, i) => (
                  <div key={tx.id}>
                    {i > 0 && <div className="hairline-top" />}
                    <TransactionRow tx={tx} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="ghost"
              fullWidth
              loading={loadingMore}
              onClick={() => load(page + 1, 'append')}
              style={{ marginTop: 16 }}
            >
              Показати ще
            </Button>
          )}
          {!hasMore && items.length > PAGE_SIZE && (
            <p className="t-caption text-3" style={{ textAlign: 'center', marginTop: 16 }}>
              Це всі операції
            </p>
          )}
        </>
      )}
    </PullToRefresh>
  )
}

function groupByDay(items: TransactionResponse[]) {
  const map = new Map<string, TransactionResponse[]>()
  for (const tx of items) {
    const day = formatDateShort(tx.createdAt)
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(tx)
  }
  return Array.from(map.entries()).map(([day, list]) => ({ day, items: list }))
}

function pluralOps(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'операція'
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'операції'
  return 'операцій'
}
