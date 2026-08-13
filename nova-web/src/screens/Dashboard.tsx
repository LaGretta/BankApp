import { ArrowLeftRight, CreditCard, LogOut, Plus, PlusCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type ReactNode, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { getHistory } from '../api/transactions'
import { AccountRow } from '../components/AccountRow'
import { EmptyState } from '../components/EmptyState'
import { FlagBadge } from '../components/FlagBadge'
import { PullToRefresh } from '../components/PullToRefresh'
import { RowSkeleton, Skeleton } from '../components/Skeleton'
import { TransactionRow } from '../components/TransactionRow'
import { useAsync } from '../hooks/useAsync'
import { useCountUp } from '../hooks/useCountUp'
import { CURRENCY_SYMBOL, NUM_TO_CURRENCY, type CurrencyCode } from '../lib/enums'
import { formatAmount } from '../lib/format'
import { useAuthStore } from '../store/authStore'

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const accountsQ = useAsync(() => getAccounts(), [])
  const historyQ = useAsync(() => getHistory(1, 4), [])

  const refresh = useCallback(async () => {
    await Promise.all([accountsQ.reload({ silent: true }), historyQ.reload({ silent: true })])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const accounts = accountsQ.data ?? []
  const loading = accountsQ.loading

  // головна валюта: UAH якщо є, інакше валюта першого рахунку
  const primary: CurrencyCode =
    accounts.find((a) => NUM_TO_CURRENCY[a.currency] === 'UAH')
      ? 'UAH'
      : accounts.length
        ? NUM_TO_CURRENCY[accounts[0].currency]
        : 'UAH'

  const heroTotal = accounts
    .filter((a) => NUM_TO_CURRENCY[a.currency] === primary)
    .reduce((s, a) => s + a.balance, 0)

  const others = Object.entries(
    accounts
      .filter((a) => NUM_TO_CURRENCY[a.currency] !== primary)
      .reduce<Record<string, number>>((acc, a) => {
        const c = NUM_TO_CURRENCY[a.currency]
        acc[c] = (acc[c] ?? 0) + a.balance
        return acc
      }, {}),
  )

  const animated = useCountUp(heroTotal)

  return (
    <PullToRefresh onRefresh={refresh}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p className="t-caption text-3">Вітаємо,</p>
          <h1 className="t-title" style={{ marginTop: 2 }}>
            {user?.firstName ?? 'Nova'} 👋
          </h1>
        </div>
        <button
          aria-label="Вийти"
          onClick={logout}
          className="control"
          style={{ width: 40, height: 40, borderRadius: 'var(--r-field)', color: 'var(--text-2)' }}
        >
          <span className="control-content">
            <LogOut size={18} strokeWidth={1.9} />
          </span>
        </button>
      </div>

      {/* balance card */}
      <div
        className="surface"
        style={{
          background: 'linear-gradient(160deg,#1C1B22,#100F14)',
          boxShadow: 'var(--e3), var(--lit)',
          borderRadius: 'var(--r-card)',
          padding: '22px 20px',
        }}
      >
        <p className="mono-cap">Загальний баланс</p>
        {loading ? (
          <Skeleton width="60%" height={38} style={{ marginTop: 12 }} />
        ) : (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="num-balance">{formatAmount(animated)}</span>
            <span className="num-balance" style={{ color: 'var(--text-3)', fontSize: 24 }}>
              {CURRENCY_SYMBOL[primary]}
            </span>
          </div>
        )}
        {others.length > 0 && !loading && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {others.map(([code, sum]) => (
              <span
                key={code}
                className="mono"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-2)',
                  padding: '5px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--hairline)',
                  background: 'var(--s1)',
                }}
              >
                {formatAmount(sum)} {CURRENCY_SYMBOL[code as CurrencyCode]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
        <QuickAction icon={ArrowLeftRight} label="Переказ" onClick={() => navigate('/transfer')} />
        <QuickAction icon={PlusCircle} label="Поповнити" onClick={() => navigate('/topup')} />
        <QuickAction icon={CreditCard} label="Картка" onClick={() => navigate('/cards/new')} />
      </div>

      {/* accounts */}
      <SectionHeader
        title="Мої рахунки"
        action={
          <button
            onClick={() => navigate('/accounts')}
            className="t-caption"
            style={{ color: 'var(--accent)', fontWeight: 600 }}
          >
            Усі
          </button>
        }
      />
      <div className="surface" style={{ padding: '4px 14px' }}>
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : accounts.length === 0 ? (
          <EmptyState
            title="Ще немає рахунків"
            subtitle="Відкрийте перший рахунок, щоб почати користуватися Nova."
            action={
              <button
                onClick={() => navigate('/accounts')}
                className="control"
                data-on=""
                style={{ padding: '12px 18px', borderRadius: 'var(--r-field)', width: '100%' }}
              >
                <span className="control-content">
                  <Plus size={18} strokeWidth={1.9} /> Відкрити рахунок
                </span>
              </button>
            }
          />
        ) : (
          accounts.map((a, i) => (
            <div key={a.id}>
              {i > 0 && <div className="hairline-top" />}
              <AccountRow account={a} />
            </div>
          ))
        )}
      </div>

      {/* recent activity */}
      {accounts.length > 0 && (
        <>
          <SectionHeader
            title="Остання активність"
            action={
              <button
                onClick={() => navigate('/history')}
                className="t-caption"
                style={{ color: 'var(--accent)', fontWeight: 600 }}
              >
                Історія
              </button>
            }
          />
          <div className="surface" style={{ padding: '4px 14px' }}>
            {historyQ.loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : (historyQ.data?.items.length ?? 0) === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 6px' }}>
                <FlagBadge currency={primary} size={34} />
                <span className="t-label text-3">Операцій ще немає</span>
              </div>
            ) : (
              historyQ.data!.items.map((tx, i) => (
                <div key={tx.id}>
                  {i > 0 && <div className="hairline-top" />}
                  <TransactionRow tx={tx} />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </PullToRefresh>
  )
}

function QuickAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="control"
      style={{
        flexDirection: 'column',
        gap: 8,
        padding: '16px 8px',
        borderRadius: 'var(--r-tile)',
        color: 'var(--text-2)',
      }}
    >
      <span className="control-content" style={{ flexDirection: 'column', gap: 8 }}>
        <Icon size={22} strokeWidth={1.9} />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      </span>
    </button>
  )
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '26px 4px 12px',
      }}
    >
      <h2 className="t-title">{title}</h2>
      {action}
    </div>
  )
}
