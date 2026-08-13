import { Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAccount } from '../api/accounts'
import { Amount } from '../components/Amount'
import { BankCard } from '../components/BankCard'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { FlagBadge } from '../components/FlagBadge'
import { CardSkeleton } from '../components/Skeleton'
import { ErrorScreen } from '../components/StateScreen'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { CURRENCY_NAME, NUM_TO_CURRENCY, NUM_TO_TIER } from '../lib/enums'

export function AccountDetail() {
  const { id } = useParams()
  const accountId = Number(id)
  const navigate = useNavigate()
  const { data: account, loading, error, reload } = useAsync(() => getAccount(accountId), [accountId])

  const code = account ? (NUM_TO_CURRENCY[account.currency] ?? 'UAH') : 'UAH'

  return (
    <div>
      <TopBar back title="Рахунок" />

      {loading ? (
        <CardSkeleton />
      ) : error || !account ? (
        <ErrorScreen
          message={error ?? 'Рахунок не знайдено'}
          action={<Button variant="ghost" onClick={() => reload()}>Повторити</Button>}
        />
      ) : (
        <>
          {/* balance hero */}
          <div
            className="surface"
            style={{
              background: 'linear-gradient(160deg,#1C1B22,#100F14)',
              boxShadow: 'var(--e3), var(--lit)',
              borderRadius: 'var(--r-card)',
              padding: '22px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <FlagBadge currency={code} size={46} />
            <div style={{ flex: 1 }}>
              <p className="mono-cap">{CURRENCY_NAME[code]} · рахунок</p>
              <div style={{ marginTop: 6 }}>
                <Amount value={account.balance} currency={account.currency} size={28} />
              </div>
              <p className="t-caption text-3 mono" style={{ marginTop: 6 }}>
                № {String(account.id).padStart(8, '0')}
              </p>
            </div>
          </div>

          {/* cards */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '26px 4px 12px',
            }}
          >
            <h2 className="t-title">Картки</h2>
            <button
              onClick={() => navigate('/cards/new', { state: { accountId } })}
              className="t-caption"
              style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}
            >
              <Plus size={15} strokeWidth={2} /> Нова
            </button>
          </div>

          {account.cards.length === 0 ? (
            <EmptyState
              title="Немає карток"
              subtitle="Випустіть картку White, Black або Platinum для цього рахунку."
              action={
                <Button fullWidth onClick={() => navigate('/cards/new', { state: { accountId } })}>
                  <Plus size={18} strokeWidth={1.9} /> Випустити картку
                </Button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {account.cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => navigate(`/cards/${card.id}`)}
                  style={{ padding: 0, textAlign: 'left', width: '100%' }}
                >
                  <BankCard
                    tier={NUM_TO_TIER[card.cardType] ?? 'White'}
                    number={card.number}
                    holderName={card.holderName}
                    expiryDate={card.expiryDate}
                    isActive={card.isActive}
                    interactive={false}
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
