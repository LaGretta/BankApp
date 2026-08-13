import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { createAccount, getAccounts } from '../api/accounts'
import { AccountRow } from '../components/AccountRow'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { FlagBadge } from '../components/FlagBadge'
import { PullToRefresh } from '../components/PullToRefresh'
import { RowSkeleton } from '../components/Skeleton'
import { Sheet } from '../components/Sheet'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { CURRENCY_NAME, type CurrencyCode } from '../lib/enums'
import { toast } from '../store/toastStore'

const CURRENCIES: CurrencyCode[] = ['UAH', 'USD', 'EUR']

export function Accounts() {
  const { data, loading, error, reload } = useAsync(() => getAccounts(), [])
  const [sheet, setSheet] = useState(false)
  const [picked, setPicked] = useState<CurrencyCode>('UAH')
  const [busy, setBusy] = useState(false)

  const accounts = data ?? []

  const refresh = useCallback(async () => {
    await reload({ silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function open() {
    setBusy(true)
    try {
      await createAccount(picked)
      toast.success(`Рахунок ${picked} відкрито`)
      setSheet(false)
      await reload({ silent: true })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося відкрити рахунок')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PullToRefresh onRefresh={refresh}>
        <TopBar
          title="Рахунки"
          right={
            <button
              aria-label="Відкрити рахунок"
              onClick={() => setSheet(true)}
              className="control"
              data-on=""
              style={{ width: 40, height: 40, borderRadius: 'var(--r-field)' }}
            >
              <span className="control-content">
                <Plus size={20} strokeWidth={2} />
              </span>
            </button>
          }
        />

        {loading ? (
          <div className="surface" style={{ padding: '4px 14px' }}>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : error ? (
          <EmptyState title="Не вдалося завантажити" subtitle={error} />
        ) : accounts.length === 0 ? (
          <EmptyState
            title="Ще немає рахунків"
            subtitle="Відкрийте рахунок у гривні, доларі або євро."
            action={
              <Button fullWidth onClick={() => setSheet(true)}>
                <Plus size={18} strokeWidth={1.9} /> Відкрити рахунок
              </Button>
            }
          />
        ) : (
          <div className="surface" style={{ padding: '4px 14px' }}>
            {accounts.map((a, i) => (
              <div key={a.id}>
                {i > 0 && <div className="hairline-top" />}
                <AccountRow account={a} />
              </div>
            ))}
          </div>
        )}
      </PullToRefresh>

      <Sheet open={sheet} onClose={() => setSheet(false)}>
        <h2 className="t-title" style={{ marginBottom: 4 }}>
          Новий рахунок
        </h2>
        <p className="t-body text-2" style={{ marginBottom: 18 }}>
          Оберіть валюту рахунку
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => setPicked(c)}
              className="control"
              data-on={picked === c ? '' : undefined}
              style={{
                justifyContent: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--r-field)',
              }}
            >
              {picked === c && <span className="sheen" />}
              <span className="control-content" style={{ gap: 12, width: '100%', justifyContent: 'flex-start' }}>
                <FlagBadge currency={c} size={34} />
                <span style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>
                    {c}
                  </span>
                  <span className="t-caption" style={{ opacity: 0.7 }}>
                    {CURRENCY_NAME[c]}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
        <Button fullWidth loading={busy} onClick={open}>
          Відкрити рахунок {picked}
        </Button>
      </Sheet>
    </>
  )
}
