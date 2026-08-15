import { ArrowLeftRight, Ban, Gauge, LogOut, Plus, PlusCircle, Wallet } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { blockCard } from '../api/cards'
import { getHistory } from '../api/transactions'
import { Button } from '../components/Button'
import { CardCarousel } from '../components/CardCarousel'
import { EmptyState } from '../components/EmptyState'
import { FlipCard } from '../components/FlipCard'
import { PullToRefresh } from '../components/PullToRefresh'
import { RowSkeleton, Skeleton } from '../components/Skeleton'
import { Sheet } from '../components/Sheet'
import { TransactionRow } from '../components/TransactionRow'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { last4 } from '../lib/format'
import type { AccountResponse, CardResponse } from '../lib/types'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

interface CardCtx {
  card: CardResponse
  account: AccountResponse
  primary: boolean
}

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const focus = (location.state as { focusAccountId?: number; focusCardNumber?: string } | null) ?? null
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const accountsQ = useAsync(() => getAccounts(), [])
  // тягнемо ширшу історію й фільтруємо по активному рахунку клієнтом
  const historyQ = useAsync(() => getHistory(1, 50), [])

  const [active, setActive] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [blockAsk, setBlockAsk] = useState(false)
  const [busy, setBusy] = useState(false)

  const accounts = accountsQ.data ?? []
  const cards: CardCtx[] = useMemo(
    () =>
      accounts.flatMap((acc, ai) =>
        acc.cards.map((card) => ({ card, account: acc, primary: ai === 0 })),
      ),
    [accounts],
  )
  const myAccountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts])

  const refresh = useCallback(async () => {
    await Promise.all([accountsQ.reload({ silent: true }), historyQ.reload({ silent: true })])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCtx = cards[active] ?? cards[0]

  // початкова активна картка — за focus зі стану навігації (після переказу/поповнення)
  const initialIndex = useMemo(() => {
    if (!cards.length) return 0
    if (focus?.focusCardNumber) {
      const i = cards.findIndex((c) => c.card.number.replace(/\s/g, '') === focus.focusCardNumber)
      if (i >= 0) return i
    }
    if (focus?.focusAccountId != null) {
      const i = cards.findIndex((c) => c.account.id === focus.focusAccountId)
      if (i >= 0) return i
    }
    return 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length])

  // історія лише активного рахунку
  const accountHistory = useMemo(() => {
    const accId = activeCtx?.account.id
    if (accId == null) return []
    return (historyQ.data?.items ?? [])
      .filter((tx) => tx.fromAccountId === accId || tx.toAccountId === accId)
      .slice(0, 4)
  }, [historyQ.data, activeCtx])

  async function doBlock() {
    if (!activeCtx) return
    setBusy(true)
    try {
      await blockCard(activeCtx.card.id)
      toast.success('Картку заблоковано')
      setBlockAsk(false)
      await accountsQ.reload({ silent: true })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося заблокувати картку')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <p className="t-caption text-3">Вітаємо,</p>
          <h1 className="t-title" style={{ marginTop: 2 }}>
            {user?.firstName ?? 'Nova'} 👋
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            aria-label="Рахунки"
            onClick={() => navigate('/accounts')}
            className="control"
            style={{ width: 40, height: 40, borderRadius: 'var(--r-field)', color: 'var(--text-2)' }}
          >
            <span className="control-content"><Wallet size={18} strokeWidth={1.9} /></span>
          </button>
          <button
            aria-label="Вийти"
            onClick={logout}
            className="control"
            style={{ width: 40, height: 40, borderRadius: 'var(--r-field)', color: 'var(--text-2)' }}
          >
            <span className="control-content"><LogOut size={18} strokeWidth={1.9} /></span>
          </button>
        </div>
      </div>

      {accountsQ.loading ? (
        <Skeleton height={208} radius={18} />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Ласкаво просимо до Nova"
          subtitle="Відкрийте перший рахунок, щоб випустити картку."
          action={<Button fullWidth onClick={() => navigate('/accounts')}><Plus size={18} strokeWidth={1.9} /> Відкрити рахунок</Button>}
        />
      ) : cards.length === 0 ? (
        <EmptyState
          title="Ще немає карток"
          subtitle="Випустіть свою першу картку Nova — White, Black або Platinum."
          action={<Button fullWidth onClick={() => navigate('/cards/new')}><Plus size={18} strokeWidth={1.9} /> Випустити картку</Button>}
        />
      ) : (
        <>
          {/* card carousel */}
          <CardCarousel
            initialIndex={initialIndex}
            onActiveChange={(i) => {
              setActive(i)
              setFlipped(false)
            }}
          >
            {cards.map((c, i) => (
              <FlipCard
                key={c.card.id}
                tier={c.card.cardType}
                number={c.card.number}
                holderName={c.card.holderName}
                expiryDate={c.card.expiryDate}
                isActive={c.card.isActive}
                balance={c.account.balance}
                currency={c.account.currency}
                accountId={c.account.id}
                cardId={c.card.id}
                primary={c.primary}
                flipped={i === active ? flipped : false}
                onFlip={i === active ? () => setFlipped((f) => !f) : () => undefined}
              />
            ))}
          </CardCarousel>

          {/* quick actions — front vs back */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
            {!flipped ? (
              <>
                <QuickAction
                  primary
                  icon={<ArrowLeftRight size={20} strokeWidth={1.9} />}
                  label="Переказ"
                  onClick={() =>
                    navigate('/transfer', {
                      state: { fromAccountId: activeCtx?.account.id, fromCardId: activeCtx?.card.id },
                    })
                  }
                />
                <QuickAction
                  icon={<PlusCircle size={20} strokeWidth={1.9} />}
                  label="Поповнити"
                  onClick={() => navigate('/topup', { state: { cardNumber: activeCtx?.card.number } })}
                />
              </>
            ) : (
              <>
                <QuickAction icon={<Gauge size={20} strokeWidth={1.9} />} label="Ліміти" onClick={() => activeCtx && navigate(`/cards/${activeCtx.card.id}/limit`)} />
                <QuickAction
                  icon={<Ban size={20} strokeWidth={1.9} />}
                  label={activeCtx?.card.isActive ? 'Заблокувати' : 'Заблоковано'}
                  disabled={!activeCtx?.card.isActive}
                  danger
                  onClick={() => setBlockAsk(true)}
                />
              </>
            )}
          </div>
          <p className="t-caption text-3" style={{ textAlign: 'center', marginTop: 12 }}>
            {flipped ? 'Торкніться картки, щоб повернути' : 'Торкніться картки — реквізити та CVV'}
          </p>

          {/* recent activity — активного рахунку */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 4px 12px' }}>
            <h2 className="t-title">Операції за карткою</h2>
            <button onClick={() => navigate('/history')} className="t-caption" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Уся історія
            </button>
          </div>
          <div className="surface" style={{ padding: '4px 14px' }}>
            {historyQ.loading ? (
              <><RowSkeleton /><RowSkeleton /></>
            ) : accountHistory.length === 0 ? (
              <p className="t-label text-3" style={{ padding: '16px 6px' }}>Операцій за цією карткою ще немає</p>
            ) : (
              accountHistory.map((tx, i) => (
                <div key={tx.id}>
                  {i > 0 && <div className="hairline-top" />}
                  <TransactionRow tx={tx} myAccountIds={myAccountIds} />
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* block confirm */}
      <Sheet open={blockAsk} onClose={() => setBlockAsk(false)}>
        <h2 className="t-title" style={{ marginBottom: 6 }}>Заблокувати картку?</h2>
        <p className="t-body text-2" style={{ marginBottom: 20 }}>
          Картку •• {activeCtx ? last4(activeCtx.card.number) : ''} буде заблоковано. Операції за нею стануть недоступними.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button fullWidth loading={busy} onClick={doBlock} style={{ background: 'linear-gradient(180deg,#E0808F,#c96676)', color: '#fff' }}>
            Так, заблокувати
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setBlockAsk(false)} disabled={busy}>Скасувати</Button>
        </div>
      </Sheet>
    </PullToRefresh>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
  primary,
  danger,
  disabled,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  primary?: boolean
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="control"
      data-on={primary ? '' : undefined}
      style={{
        flexDirection: 'column',
        gap: 7,
        padding: '15px 8px',
        borderRadius: 'var(--r-tile)',
        color: danger ? 'var(--negative)' : primary ? undefined : 'var(--text-2)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {primary && <span className="sheen" />}
      <span className="control-content" style={{ flexDirection: 'column', gap: 7 }}>
        {icon}
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      </span>
    </button>
  )
}
