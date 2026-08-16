import { CalendarClock, Plus } from 'lucide-react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLoans } from '../api/loans'
import { Amount } from '../components/Amount'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { FlagBadge } from '../components/FlagBadge'
import { PullToRefresh } from '../components/PullToRefresh'
import { Skeleton } from '../components/Skeleton'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { formatAmount, formatDateShort } from '../lib/format'
import type { LoanResponse, LoanStatus } from '../lib/types'

const STATUS: Record<LoanStatus, { label: string; color: string; bg: string; border: string }> = {
  Active: { label: 'Активний', color: 'var(--accent)', bg: 'var(--accent-soft)', border: 'rgba(127,230,214,.25)' },
  Paid: { label: 'Погашено', color: 'var(--paid)', bg: 'rgba(159,233,220,.1)', border: 'rgba(159,233,220,.25)' },
  Overdue: { label: 'Прострочено', color: 'var(--overdue)', bg: 'var(--overdue-bg)', border: 'var(--overdue-border)' },
}

export function Loans() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => getLoans(), [])
  const loans = data ?? []

  const refresh = useCallback(async () => {
    await reload({ silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PullToRefresh onRefresh={refresh}>
      <TopBar
        title="Кредити"
        right={
          loans.length > 0 ? (
            <button
              aria-label="Новий кредит"
              onClick={() => navigate('/loans/new')}
              className="control"
              data-on=""
              style={{ width: 40, height: 40, borderRadius: 'var(--r-field)' }}
            >
              <span className="control-content"><Plus size={20} strokeWidth={2} /></span>
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <>
          <Skeleton height={120} radius={18} style={{ marginBottom: 10 }} />
          <Skeleton height={120} radius={18} />
        </>
      ) : error ? (
        <EmptyState title="Не вдалося завантажити" subtitle={error} action={<Button fullWidth onClick={() => reload()}>Повторити</Button>} />
      ) : loans.length === 0 ? (
        <EmptyState
          title="Кредитів поки немає"
          subtitle="Отримайте до 200 000 ₴ — рішення за 2 хвилини, без паперів."
          action={<Button fullWidth onClick={() => navigate('/loans/new')}><Plus size={18} strokeWidth={1.9} /> Візьміть перший кредит</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} onClick={() => navigate(`/loans/${loan.id}`)} />
          ))}
        </div>
      )}
    </PullToRefresh>
  )
}

function LoanCard({ loan, onClick }: { loan: LoanResponse; onClick: () => void }) {
  const st = STATUS[loan.status] ?? STATUS.Active
  return (
    <button
      onClick={onClick}
      className="surface"
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '16px', borderRadius: 'var(--r-tile)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <FlagBadge currency={loan.currency} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-title" style={{ fontSize: 15 }}>Кредит {formatAmount(loan.principal)} {loan.currency}</div>
          <div className="t-caption text-3" style={{ marginTop: 2 }}>{loan.termMonths} міс · {normRate(loan.annualRate)}% річних</div>
        </div>
        <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 999, padding: '4px 10px' }}>
          {st.label}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="mono-cap">Залишок боргу</p>
          <div style={{ marginTop: 4 }}><Amount value={loan.remainingBalance} currency={loan.currency} size={20} /></div>
        </div>
        {loan.status !== 'Paid' && (
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
            <CalendarClock size={14} strokeWidth={1.9} />
            <span className="mono" style={{ fontSize: 11 }}>
              {formatAmount(loan.monthlyPayment)} · до {formatDateShort(loan.nextPaymentDate)}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

/** annualRate може прийти як 20 або 0.20 — показуємо у відсотках. */
export function normRate(r: number): number {
  return r <= 1 ? Math.round(r * 100) : Math.round(r)
}
