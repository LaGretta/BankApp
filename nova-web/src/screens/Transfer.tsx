import { ArrowDown, Hash, Wallet } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { transfer } from '../api/transactions'
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
import { CURRENCY_SYMBOL, NUM_TO_CURRENCY } from '../lib/enums'
import { newGuid } from '../lib/idempotency'
import { toast } from '../store/toastStore'

type Mode = 'own' | 'number'

export function Transfer() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(() => getAccounts(), [])
  const accounts = useMemo(() => data ?? [], [data])

  const [fromId, setFromId] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('own')
  const [toId, setToId] = useState<number | null>(null)
  const [toNumber, setToNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // ідемпотентність: новий ключ на нову операцію; ретрай тих самих параметрів → той самий ключ
  const idemKey = useRef(newGuid())

  const from = accounts.find((a) => a.id === fromId) ?? null
  const fromCode = from ? NUM_TO_CURRENCY[from.currency] : undefined

  // призначення тільки тієї ж валюти (контракт: same-currency only)
  const sameCurrencyTargets = accounts.filter(
    (a) => from && a.currency === from.currency && a.id !== from.id,
  )

  // авто-вибір рахунку-джерела
  useEffect(() => {
    if (fromId === null && accounts.length) setFromId(accounts[0].id)
  }, [accounts, fromId])

  // новий ключ, коли змінюються параметри операції
  useEffect(() => {
    idemKey.current = newGuid()
  }, [fromId, toId, toNumber, amount, description, mode])

  const amountNum = Number(amount.replace(',', '.'))
  const targetId = mode === 'own' ? toId : Number(toNumber)
  const validAmount = amountNum > 0
  const enoughFunds = from ? amountNum <= from.balance : false
  const validTarget = mode === 'own' ? toId != null : /^\d+$/.test(toNumber.trim())
  const canSubmit = !!from && validTarget && validAmount && enoughFunds && targetId !== fromId

  async function submit() {
    if (!from || !targetId) return
    setBusy(true)
    try {
      await transfer({
        fromAccountId: from.id,
        toAccountId: targetId,
        amount: amountNum,
        description: description.trim(),
        idempotencyKey: idemKey.current,
      })
      setDone(true)
    } catch (e) {
      // ключ НЕ змінюємо — щоб ретрай тієї ж операції дедуплікувався
      toast.error(e instanceof ApiError ? e.detail : 'Переказ не виконано')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar back title="Переказ" />
        <div className="surface" style={{ padding: '4px 14px' }}>
          <RowSkeleton />
          <RowSkeleton />
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div>
        <TopBar back title="Переказ" />
        <EmptyState
          title="Немає рахунків"
          subtitle="Щоб робити перекази, спершу відкрийте рахунок."
          action={<Button fullWidth onClick={() => navigate('/accounts')}>До рахунків</Button>}
        />
      </div>
    )
  }

  return (
    <div>
      <TopBar back title="Переказ" />

      {/* FROM */}
      <p className="mono-cap" style={{ margin: '0 4px 10px' }}>
        Звідки
      </p>
      <div className="surface" style={{ padding: '4px 14px' }}>
        {accounts.map((a, i) => {
          const code = NUM_TO_CURRENCY[a.currency] ?? 'UAH'
          const sel = fromId === a.id
          return (
            <div key={a.id}>
              {i > 0 && <div className="hairline-top" />}
              <button
                onClick={() => {
                  setFromId(a.id)
                  setToId(null)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 2px' }}
              >
                <FlagBadge currency={code} size={38} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="mono num-value">{code}</div>
                  <div className="t-caption text-3" style={{ marginTop: 2 }}>
                    Доступно
                  </div>
                </div>
                <Amount value={a.balance} currency={a.currency} size={15} />
                <span
                  style={{
                    marginLeft: 6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {sel && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)',
            background: 'var(--s1)',
          }}
        >
          <ArrowDown size={17} strokeWidth={1.9} />
        </span>
      </div>

      {/* TO — mode switch */}
      <div style={{ display: 'flex', gap: 8, margin: '0 0 12px' }}>
        <ModeBtn active={mode === 'own'} onClick={() => setMode('own')} icon={<Wallet size={16} strokeWidth={1.9} />}>
          Свій рахунок
        </ModeBtn>
        <ModeBtn active={mode === 'number'} onClick={() => setMode('number')} icon={<Hash size={16} strokeWidth={1.9} />}>
          За номером
        </ModeBtn>
      </div>

      {mode === 'own' ? (
        sameCurrencyTargets.length === 0 ? (
          <div
            className="surface"
            style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)' }}
          >
            <span className="t-label">
              Немає іншого рахунку у {fromCode}. Оберіть «За номером» або відкрийте ще один рахунок.
            </span>
          </div>
        ) : (
          <div className="surface" style={{ padding: '4px 14px' }}>
            {sameCurrencyTargets.map((a, i) => {
              const code = NUM_TO_CURRENCY[a.currency] ?? 'UAH'
              const sel = toId === a.id
              return (
                <div key={a.id}>
                  {i > 0 && <div className="hairline-top" />}
                  <button
                    onClick={() => setToId(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 2px' }}
                  >
                    <FlagBadge currency={code} size={38} />
                    <span className="mono num-value" style={{ flex: 1, textAlign: 'left' }}>
                      {code} · №{String(a.id).padStart(8, '0')}
                    </span>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {sel && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <Field
          label="Номер рахунку отримувача"
          placeholder="Напр. 10024"
          inputMode="numeric"
          icon={<Hash size={18} strokeWidth={1.9} />}
          value={toNumber}
          onChange={(e) => setToNumber(e.target.value.replace(/\D/g, ''))}
          hint={fromCode ? `Валюта переказу: ${fromCode} (лише той самий тип рахунку)` : undefined}
        />
      )}

      {/* amount + description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 16 }}>
        <Field
          label="Сума"
          placeholder="0.00"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
          suffix={<span className="mono text-3" style={{ fontWeight: 600 }}>{fromCode ? CURRENCY_SYMBOL[fromCode] : ''}</span>}
          error={amount !== '' && !validAmount ? 'Введіть суму більшу за 0' : !enoughFunds && amount !== '' ? 'Недостатньо коштів' : undefined}
        />
        <Field
          label="Опис (необовʼязково)"
          placeholder="За каву ☕"
          value={description}
          maxLength={120}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button fullWidth loading={busy} disabled={!canSubmit} onClick={submit} style={{ marginTop: 22 }}>
        Переказати{validAmount && fromCode ? ` ${amountNum.toFixed(2)} ${CURRENCY_SYMBOL[fromCode]}` : ''}
      </Button>

      {done && (
        <SuccessOverlay
          title="Переказ виконано"
          subtitle={
            fromCode
              ? `${amountNum.toFixed(2)} ${CURRENCY_SYMBOL[fromCode]} успішно надіслано.`
              : 'Кошти успішно надіслано.'
          }
          onDone={() => navigate('/dashboard', { replace: true })}
        />
      )}
    </div>
  )
}

function ModeBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="control"
      data-on={active ? '' : undefined}
      style={{ flex: 1, padding: '11px 8px', borderRadius: 'var(--r-field)', fontSize: 13.5, fontWeight: 600 }}
    >
      {active && <span className="sheen" />}
      <span className="control-content" style={{ gap: 7 }}>
        {icon}
        {children}
      </span>
    </button>
  )
}
