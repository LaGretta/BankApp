import { ArrowDown, CreditCard, Users } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { transfer, transferByCard } from '../api/transactions'
import { Amount } from '../components/Amount'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Field } from '../components/Field'
import { FlagBadge } from '../components/FlagBadge'
import { RowSkeleton } from '../components/Skeleton'
import { SuccessOverlay } from '../components/SuccessOverlay'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { CURRENCY_SYMBOL, TIER_LABEL } from '../lib/enums'
import { last4 } from '../lib/format'
import { newGuid } from '../lib/idempotency'
import type { AccountResponse, CardResponse } from '../lib/types'
import { toast } from '../store/toastStore'

type Mode = 'card' | 'own'

interface MyCard {
  card: CardResponse
  account: AccountResponse
}

export function Transfer() {
  const navigate = useNavigate()
  const location = useLocation()
  const preset = (location.state as { fromAccountId?: number; fromCardId?: number } | null) ?? null

  const { data, loading } = useAsync(() => getAccounts(), [])
  const accounts = useMemo(() => data ?? [], [data])
  const myCards: MyCard[] = useMemo(
    () => accounts.flatMap((acc) => acc.cards.map((card) => ({ card, account: acc }))),
    [accounts],
  )

  const [mode, setMode] = useState<Mode>('card')
  const [fromCardId, setFromCardId] = useState<number | null>(preset?.fromCardId ?? null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  // own-mode
  const [ownFromId, setOwnFromId] = useState<number | null>(preset?.fromAccountId ?? null)
  const [ownToId, setOwnToId] = useState<number | null>(null)

  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const idemKey = useRef(newGuid())

  // авто-вибір
  useEffect(() => {
    if (fromCardId === null && myCards.length) setFromCardId(myCards[0].card.id)
    if (ownFromId === null && accounts.length) setOwnFromId(accounts[0].id)
  }, [myCards, accounts, fromCardId, ownFromId])

  // новий idem-ключ на зміну параметрів операції; ретрай тих самих → той самий ключ
  useEffect(() => {
    idemKey.current = newGuid()
  }, [mode, fromCardId, recipient, amount, description, ownFromId, ownToId])

  const fromCard = myCards.find((m) => m.card.id === fromCardId) ?? myCards[0] ?? null
  const ownFrom = accounts.find((a) => a.id === ownFromId) ?? null
  const ownTargets = accounts.filter((a) => ownFrom && a.currency === ownFrom.currency && a.id !== ownFrom.id)

  const amountNum = Number(amount.replace(',', '.'))
  const recipientDigits = recipient.replace(/\s/g, '')

  const cardCurrency = fromCard?.account.currency
  const ownCurrency = ownFrom?.currency
  const activeCurrency = mode === 'card' ? cardCurrency : ownCurrency
  const activeBalance = mode === 'card' ? fromCard?.account.balance : ownFrom?.balance

  const validAmount = amountNum > 0
  const enough = activeBalance != null ? amountNum <= activeBalance : false
  const canCard = !!fromCard && recipientDigits.length === 16 && validAmount && enough
  const canOwn = !!ownFrom && ownToId != null && validAmount && enough
  const canSubmit = mode === 'card' ? canCard : canOwn

  async function submit() {
    setBusy(true)
    try {
      if (mode === 'card' && fromCard) {
        await transferByCard({
          fromAccountId: fromCard.account.id,
          cardNumber: recipientDigits,
          amount: amountNum,
          description: description.trim(),
          idempotencyKey: idemKey.current,
        })
      } else if (mode === 'own' && ownFrom && ownToId) {
        await transfer({
          fromAccountId: ownFrom.id,
          toAccountId: ownToId,
          amount: amountNum,
          description: description.trim(),
          idempotencyKey: idemKey.current,
        })
      }
      setDone(true)
    } catch (e) {
      // ключ НЕ змінюємо — ретрай тієї ж операції дедуплікується бекендом
      toast.error(e instanceof ApiError ? e.detail : 'Переказ не виконано')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar back title="Переказ" />
        <div className="surface" style={{ padding: '4px 14px' }}><RowSkeleton /><RowSkeleton /></div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div>
        <TopBar back title="Переказ" />
        <EmptyState
          title="Немає рахунків"
          subtitle="Щоб робити перекази, спершу відкрийте рахунок і випустіть картку."
          action={<Button fullWidth onClick={() => navigate('/accounts')}>До рахунків</Button>}
        />
      </div>
    )
  }

  const symbol = activeCurrency ? CURRENCY_SYMBOL[activeCurrency] : ''

  return (
    <div>
      <TopBar back title="Переказ" />

      {/* mode switch — card primary, own secondary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <ModeTab active={mode === 'card'} onClick={() => setMode('card')} icon={<CreditCard size={16} strokeWidth={1.9} />}>
          За карткою
        </ModeTab>
        <ModeTab active={mode === 'own'} onClick={() => setMode('own')} icon={<Users size={16} strokeWidth={1.9} />}>
          Між своїми
        </ModeTab>
      </div>

      {mode === 'card' ? (
        myCards.length === 0 ? (
          <EmptyState
            title="Немає карток"
            subtitle="Випустіть картку, щоб надсилати кошти за номером картки."
            action={<Button fullWidth onClick={() => navigate('/cards/new')}>Випустити картку</Button>}
          />
        ) : (
          <>
            {/* recipient card number */}
            <Field
              label="Номер картки отримувача"
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              icon={<CreditCard size={18} strokeWidth={1.9} />}
              value={recipient}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 16)
                setRecipient(d.replace(/(.{4})/g, '$1 ').trim())
              }}
              error={recipient !== '' && recipientDigits.length !== 16 ? '16 цифр номера картки' : undefined}
            />

            {/* from card picker */}
            <p className="mono-cap" style={{ margin: '18px 4px 10px' }}>Списати з картки</p>
            <div className="surface" style={{ padding: '4px 14px' }}>
              {myCards.map((m, i) => (
                <div key={m.card.id}>
                  {i > 0 && <div className="hairline-top" />}
                  <CardPickRow m={m} selected={fromCard?.card.id === m.card.id} onSelect={() => setFromCardId(m.card.id)} />
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <>
          {/* own: from */}
          <p className="mono-cap" style={{ margin: '0 4px 10px' }}>Звідки</p>
          <div className="surface" style={{ padding: '4px 14px' }}>
            {accounts.map((a, i) => (
              <div key={a.id}>
                {i > 0 && <div className="hairline-top" />}
                <AccountPickRow account={a} selected={ownFromId === a.id} onSelect={() => { setOwnFromId(a.id); setOwnToId(null) }} showBalance />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'var(--s1)' }}>
              <ArrowDown size={17} strokeWidth={1.9} />
            </span>
          </div>

          {/* own: to */}
          <p className="mono-cap" style={{ margin: '0 4px 10px' }}>Куди (той самий {ownCurrency})</p>
          {ownTargets.length === 0 ? (
            <div className="surface" style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>
              <span className="t-label">Немає іншого рахунку у {ownCurrency}. Відкрийте ще один рахунок цієї валюти.</span>
            </div>
          ) : (
            <div className="surface" style={{ padding: '4px 14px' }}>
              {ownTargets.map((a, i) => (
                <div key={a.id}>
                  {i > 0 && <div className="hairline-top" />}
                  <AccountPickRow account={a} selected={ownToId === a.id} onSelect={() => setOwnToId(a.id)} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* amount + description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 18 }}>
        <Field
          label="Сума"
          placeholder="0.00"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
          suffix={<span className="mono text-3" style={{ fontWeight: 600 }}>{symbol}</span>}
          error={amount !== '' && !validAmount ? 'Введіть суму більшу за 0' : amount !== '' && !enough ? 'Недостатньо коштів' : undefined}
        />
        <Field
          label="Опис (необовʼязково)"
          placeholder={mode === 'card' ? 'Переказ' : 'Між своїми'}
          value={description}
          maxLength={120}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button fullWidth loading={busy} disabled={!canSubmit} onClick={submit} style={{ marginTop: 22 }}>
        Переказати{validAmount && symbol ? ` ${amountNum.toFixed(2)} ${symbol}` : ''}
      </Button>

      {done && (
        <SuccessOverlay
          title="Переказ виконано"
          subtitle={
            mode === 'card'
              ? `${amountNum.toFixed(2)} ${symbol} надіслано на картку •• ${last4(recipientDigits)}.`
              : `${amountNum.toFixed(2)} ${symbol} переказано між рахунками.`
          }
          onDone={() =>
            navigate('/dashboard', {
              replace: true,
              state: { focusAccountId: mode === 'card' ? fromCard?.account.id : ownFrom?.id },
            })
          }
        />
      )}
    </div>
  )
}

function CardPickRow({ m, selected, onSelect }: { m: MyCard; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 2px' }}>
      <FlagBadge currency={m.account.currency} size={38} />
      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <div className="t-label" style={{ fontWeight: 600, color: 'var(--text-1)' }}>
          {TIER_LABEL[m.card.cardType]} · •• {last4(m.card.number)}
        </div>
        <div className="t-caption text-3" style={{ marginTop: 2 }}>{m.account.currency} · рахунок</div>
      </div>
      <Amount value={m.account.balance} currency={m.account.currency} size={14} />
      <Radio on={selected} />
    </button>
  )
}

function AccountPickRow({ account, selected, onSelect, showBalance }: { account: AccountResponse; selected: boolean; onSelect: () => void; showBalance?: boolean }) {
  return (
    <button onClick={onSelect} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 2px' }}>
      <FlagBadge currency={account.currency} size={38} />
      <span className="mono num-value" style={{ flex: 1, textAlign: 'left' }}>
        {account.currency} · №{String(account.id).padStart(8, '0')}
      </span>
      {showBalance && <Amount value={account.balance} currency={account.currency} size={14} />}
      <Radio on={selected} />
    </button>
  )
}

function Radio({ on }: { on: boolean }) {
  return (
    <span style={{ marginLeft: 6, width: 20, height: 20, borderRadius: '50%', border: `2px solid ${on ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {on && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />}
    </span>
  )
}

function ModeTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="control"
      data-on={active ? '' : undefined}
      style={{ flex: 1, padding: '11px 8px', borderRadius: 'var(--r-field)', fontSize: 13.5, fontWeight: 600 }}
    >
      {active && <span className="sheen" />}
      <span className="control-content" style={{ gap: 7 }}>{icon}{children}</span>
    </button>
  )
}
