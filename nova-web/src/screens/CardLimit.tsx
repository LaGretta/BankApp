import { AlertTriangle, Check } from 'lucide-react'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { getCard, getCardSpentToday, setCardLimit } from '../api/cards'
import { Button } from '../components/Button'
import { Nova } from '../components/Nova'
import { CardSkeleton } from '../components/Skeleton'
import { ErrorScreen } from '../components/StateScreen'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { CURRENCY_SYMBOL, type CardTier } from '../lib/enums'
import { formatAmount, last4 } from '../lib/format'
import { toast } from '../store/toastStore'

const CHIPS = [5000, 10000, 20000, 50000]

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface Skin { bg: string; fg: string; sub: string; badge: string }
const SKINS: Record<CardTier, Skin> = {
  Black: { bg: 'radial-gradient(220px 120px at 82% -10%, rgba(127,230,214,.16), transparent 60%), linear-gradient(150deg,#26262E,#0B0B0E)', fg: '#F4F5F7', sub: 'rgba(244,245,247,.55)', badge: 'rgba(255,255,255,.22)' },
  White: { bg: 'radial-gradient(220px 120px at 82% -10%, rgba(127,230,214,.28), transparent 60%), linear-gradient(150deg,#FCFCFF,#E2E6EE)', fg: '#0A0A0C', sub: 'rgba(10,10,12,.55)', badge: 'rgba(0,0,0,.18)' },
  Platinum: { bg: 'linear-gradient(150deg,#CBD0DA,#9AA0AB 55%,#6E7480)', fg: '#15171C', sub: 'rgba(21,23,28,.55)', badge: 'rgba(255,255,255,.5)' },
}

export function CardLimit() {
  const { id } = useParams()
  const cardId = Number(id)
  const cardQ = useAsync(() => getCard(cardId), [cardId])
  const spentQ = useAsync(() => getCardSpentToday(cardId), [cardId])
  // валюта картки = валюта її рахунку (GET /cards/{id} валюти не віддає)
  const accountsQ = useAsync(() => getAccounts(), [])

  const [limitOn, setLimitOn] = useState(false)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const card = cardQ.data

  const currency = useMemo(() => {
    const acc = accountsQ.data?.find((a) => a.cards.some((c) => c.id === cardId))
    return acc?.currency ?? 'UAH'
  }, [accountsQ.data, cardId])

  // ініціалізація з бекенду
  useEffect(() => {
    if (card) {
      setLimitOn(card.dailyLimit != null)
      setAmount(card.dailyLimit != null ? String(card.dailyLimit) : '')
    }
  }, [card])

  const spent = spentQ.data?.spentToday ?? 0
  const amountNum = Number(amount.replace(/[^\d.,]/g, '').replace(',', '.'))
  const cur = CURRENCY_SYMBOL[currency]

  async function save() {
    if (!card) return
    if (limitOn && !(amountNum > 0)) {
      toast.error('Введіть ліміт більший за 0')
      return
    }
    setBusy(true)
    try {
      const updated = await setCardLimit(cardId, limitOn ? amountNum : null)
      cardQ.setData(updated)
      await spentQ.reload({ silent: true })
      toast.success(limitOn ? 'Ліміт збережено' : 'Ліміт знято')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося зберегти ліміт')
    } finally {
      setBusy(false)
    }
  }

  async function removeLimit() {
    if (!card) return
    setBusy(true)
    try {
      const updated = await setCardLimit(cardId, null)
      cardQ.setData(updated)
      setLimitOn(false)
      setAmount('')
      toast.success('Ліміт знято')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося зняти ліміт')
    } finally {
      setBusy(false)
    }
  }

  if (cardQ.loading) {
    return <div><TopBar back title="Ліміти" /><CardSkeleton /></div>
  }
  if (cardQ.error || !card) {
    return <div><TopBar back title="Ліміти" /><ErrorScreen message={cardQ.error ?? 'Картку не знайдено'} action={<Button variant="ghost" onClick={() => cardQ.reload()}>Повторити</Button>} /></div>
  }

  const tier = card.cardType
  const skin = SKINS[tier] ?? SKINS.Black

  return (
    <div>
      <TopBar back title="Ліміти" subtitle={`Ліміти для картки •••• ${last4(card.number)}`} />

      {/* context card */}
      <div
        style={{
          height: 96,
          borderRadius: 18,
          background: skin.bg,
          color: skin.fg,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 18px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12)',
          border: '1px solid rgba(255,255,255,.08)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em' }}>Nova</span>
          <span className="mono" style={{ fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', border: `1px solid ${skin.badge}`, borderRadius: 999, color: skin.sub }}>{tier}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span className="mono" style={{ fontSize: 14, letterSpacing: '0.1em', color: skin.sub }}>•••• {last4(card.number)}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#EB001B' }} />
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#F79E1B', marginLeft: -7, mixBlendMode: 'hard-light' }} />
          </span>
        </div>
      </div>

      {/* toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(160deg,#161619,#101013)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '14px 16px' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: limitOn ? 'var(--text-1)' : 'var(--text-2)' }}>
          {limitOn ? 'Денний ліміт увімкнено' : 'Без ліміту'}
        </span>
        <Toggle on={limitOn} onToggle={() => setLimitOn((v) => !v)} />
      </div>

      {/* amount + chips */}
      <div style={{ marginTop: 12, opacity: limitOn ? 1 : 0.5, pointerEvents: limitOn ? 'auto' : 'none', transition: 'opacity 160ms ease-out' }}>
        <div
          style={{
            background: 'linear-gradient(160deg,#161619,#101013)',
            borderRadius: 14,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 5,
            border: limitOn ? '1px solid var(--accent)' : '1px solid var(--hairline)',
            boxShadow: limitOn ? '0 0 0 3px rgba(127,230,214,.12)' : 'none',
          }}
        >
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            placeholder="0"
            disabled={!limitOn}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 30, color: limitOn ? 'var(--text-1)' : 'var(--text-3)' }}
          />
          <span className="mono" style={{ fontSize: 18, color: 'var(--text-3)' }}>{cur}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {CHIPS.map((c) => {
            const sel = amountNum === c
            return (
              <button
                key={c}
                onClick={() => setAmount(String(c))}
                className="control"
                data-on={sel ? '' : undefined}
                style={{ flex: 1, borderRadius: 11, padding: '9px 0', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12 }}
              >
                {sel && <span className="sheen" />}
                <span className="control-content">{formatAmount(c).replace(',00', '')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* spent today */}
      <div style={{ marginTop: 16 }}>
        <SpendBar spent={spent} limit={limitOn && amountNum > 0 ? amountNum : null} currency={cur} loading={spentQ.loading} />
      </div>

      {/* actions */}
      <Button fullWidth loading={busy} onClick={save} style={{ marginTop: 22 }}>
        <Check size={18} strokeWidth={1.9} /> Зберегти
      </Button>
      {card.dailyLimit != null && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button onClick={removeLimit} disabled={busy} className="t-label" style={{ color: 'var(--text-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Зняти ліміт
          </button>
        </div>
      )}
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={on ? 'Вимкнути ліміт' : 'Увімкнути ліміт'}
      style={{
        width: 46,
        height: 27,
        borderRadius: 999,
        padding: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        background: on
          ? 'radial-gradient(70% 60% at 40% 5%, rgba(150,238,226,.5), transparent 62%), linear-gradient(180deg,#FFFFFF,#E4E8EE)'
          : '#24242A',
        boxShadow: on
          ? '0 0 0 1px rgba(255,255,255,.4), 0 4px 12px rgba(127,230,214,.3)'
          : 'inset 0 1px 3px rgba(0,0,0,.5)',
        transition: 'background 200ms ease-out',
      }}
    >
      <span
        style={{
          width: 21,
          height: 21,
          borderRadius: '50%',
          background: on ? '#0A0A0C' : '#4A4A52',
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
          transition: 'all 200ms cubic-bezier(.22,1,.36,1)',
        }}
      />
    </button>
  )
}

function SpendBar({ spent, limit, currency, loading }: { spent: number; limit: number | null; currency: string; loading: boolean }) {
  const pct = limit ? Math.min(100, (spent / limit) * 100) : 0
  const [shown, setShown] = useState(prefersReduced ? pct : 0)
  useEffect(() => { setShown(pct) }, [pct])

  const tone: 'calm' | 'warn' | 'over' = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : 'calm'
  const fill =
    tone === 'over' ? 'linear-gradient(90deg,#E8B27A,#E0808F)' : tone === 'warn' ? 'linear-gradient(90deg,#8FD8CE,#E8C97A)' : 'linear-gradient(90deg,#5C6C74,#9FE9DC)'
  const glow = tone === 'over' ? 'rgba(224,128,143,.35)' : tone === 'warn' ? 'rgba(232,201,122,.3)' : 'rgba(127,230,214,.25)'
  const pctColor = tone === 'over' ? '#E8A07A' : tone === 'warn' ? '#E8C97A' : '#9FE9DC'
  const left = limit ? Math.max(0, limit - spent) : 0

  const box: CSSProperties = { background: 'linear-gradient(160deg,#141417,#0F0F12)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '16px 18px' }

  // no limit → spent-only
  if (!limit) {
    return (
      <div style={box}>
        <p className="mono-cap">Витрачено сьогодні</p>
        <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', marginTop: 6 }}>
          {loading ? '…' : `${formatAmount(spent)} ${currency}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: 'var(--text-3)' }}>
          <Nova state="empty" size={30} />
          <span className="t-caption">Ліміт не встановлено</span>
        </div>
      </div>
    )
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>
          {formatAmount(spent)} <span style={{ color: 'var(--text-3)' }}>/ {formatAmount(limit)} {currency}</span>
        </span>
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: pctColor }}>{Math.round(pct)}%</span>
      </div>

      <div style={{ height: 10, borderRadius: 6, background: '#0A0A0C', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.6)', overflow: 'hidden', marginTop: 12 }}>
        <div
          style={{
            height: '100%',
            width: `${shown}%`,
            borderRadius: 6,
            background: fill,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.3), 0 0 12px ${glow}`,
            transition: prefersReduced ? 'none' : 'width 700ms cubic-bezier(.22,1,.36,1), background 300ms ease-out',
          }}
        />
      </div>

      {tone === 'warn' && (
        <p className="t-caption" style={{ color: 'var(--warn)', marginTop: 10 }}>
          Залишилось {formatAmount(left)} {currency} на сьогодні
        </p>
      )}
      {tone === 'over' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Nova state="error" size={34} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--over)' }}>
              <AlertTriangle size={15} strokeWidth={1.9} />
              <span className="t-label" style={{ fontWeight: 600 }}>Денний ліміт вичерпано</span>
            </div>
            <span className="t-caption" style={{ color: 'var(--over-amber)' }}>на сьогодні досить витрат</span>
          </div>
        </div>
      )}
    </div>
  )
}
