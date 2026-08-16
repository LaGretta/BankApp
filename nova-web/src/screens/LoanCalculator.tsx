import { Check, ShieldCheck, Zap } from 'lucide-react'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { calculateLoan, takeLoan } from '../api/loans'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { FlagBadge } from '../components/FlagBadge'
import { Nova } from '../components/Nova'
import { Sheet } from '../components/Sheet'
import { RowSkeleton } from '../components/Skeleton'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { useCountUp } from '../hooks/useCountUp'
import { ApiError } from '../lib/apiClient'
import { CURRENCY_SYMBOL } from '../lib/enums'
import { formatAmount, formatDateShort } from '../lib/format'
import type { LoanCalcResponse, LoanResponse } from '../lib/types'
import { toast } from '../store/toastStore'
import { normRate } from './Loans'

const MIN = 1000
const MAX = 200000
const TERMS = [3, 6, 12, 24, 36]

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ---- warm-shift (§7): cool → amber → soft-red за tEff ---- */
const COOL = [127, 230, 214]
const MID = [230, 199, 138]
const WARM = [232, 136, 126]
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const commitRgb = (tEff: number) => (tEff < 0.5 ? mix(COOL, MID, tEff / 0.5) : mix(MID, WARM, (tEff - 0.5) / 0.5))
const toRgb = (c: number[]) => `rgb(${c.join(',')})`
const toRgba = (c: number[], a: number) => `rgba(${c.join(',')},${a})`

export function LoanCalculator() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(() => getAccounts(), [])
  const accounts = data ?? []

  const [accountId, setAccountId] = useState<number | null>(null)
  const [amount, setAmount] = useState(50000)
  const [term, setTerm] = useState(12)
  const [calc, setCalc] = useState<LoanCalcResponse | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [taken, setTaken] = useState<LoanResponse | null>(null)

  useEffect(() => {
    if (accountId === null && accounts.length) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  const account = accounts.find((a) => a.id === accountId) ?? accounts[0] ?? null
  const symbol = account ? CURRENCY_SYMBOL[account.currency] : '₴'

  // debounced /calculate — annuity рахує бекенд, показуємо тільки його числа
  useEffect(() => {
    const t = setTimeout(() => {
      calculateLoan(amount, term)
        .then(setCalc)
        .catch(() => setCalc(null))
    }, 280)
    return () => clearTimeout(t)
  }, [amount, term])

  // warm-shift driver
  const tEff = useMemo(() => {
    const t = Math.min(1, Math.max(0, (amount - MIN) / (MAX - MIN)))
    const termBias = ((term - 3) / (36 - 3)) * 0.15
    return Math.min(t + termBias, 1)
  }, [amount, term])
  const accentRgb = commitRgb(tEff)
  const accent = toRgb(accentRgb)
  const warmerRgb = commitRgb(Math.min(tEff + 0.15, 1))
  const pct = ((amount - MIN) / (MAX - MIN)) * 100
  const highCommit = tEff > 0.8 && !prefersReduced

  const animatedMonthly = useCountUp(calc?.monthlyPayment ?? 0, 260)

  async function confirm() {
    if (!account) return
    setBusy(true)
    try {
      const loan = await takeLoan({ accountId: account.id, principal: amount, termMonths: term })
      setConfirmOpen(false)
      setTaken(loan)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося оформити кредит')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div><TopBar back title="Новий кредит" /><div className="surface" style={{ padding: '4px 14px' }}><RowSkeleton /><RowSkeleton /></div></div>
  }
  if (accounts.length === 0) {
    return (
      <div>
        <TopBar back title="Новий кредит" />
        <EmptyState title="Спочатку рахунок" subtitle="Кредит зараховується на рахунок — відкрийте хоча б один." action={<Button fullWidth onClick={() => navigate('/accounts')}>До рахунків</Button>} />
      </div>
    )
  }

  const sliderStyle = {
    backgroundImage: `linear-gradient(90deg, #4A555C, ${accent})`,
    backgroundSize: `${pct}% 100%`,
    transition: 'background-size 60ms linear',
    '--thumb-glow': toRgba(accentRgb, 0.5),
  } as CSSProperties

  return (
    <div>
      <TopBar back title="Новий кредит" />

      {/* calculator card */}
      <div
        style={{
          padding: 20,
          borderRadius: 22,
          background: `radial-gradient(150% 120% at 50% -10%, ${toRgba(accentRgb, 0.1)}, transparent 60%), linear-gradient(160deg,#17171C,#0E0E12)`,
          border: '1px solid rgba(255,255,255,.09)',
          boxShadow: '0 14px 34px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)',
          transition: 'background 240ms ease-out',
        }}
      >
        {/* badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: toRgba(accentRgb, 0.12), border: `1px solid ${toRgba(accentRgb, 0.28)}`, borderRadius: 999, padding: '5px 11px', color: accent, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>
            <Zap size={12} strokeWidth={2} /> Схвалення за 2 хв
          </span>
        </div>

        {/* amount */}
        <p className="mono-cap" style={{ marginTop: 14 }}>Сума кредиту</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <span className="mono" style={{ fontWeight: 700, fontSize: 30, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{formatAmount(amount)}</span>
          <span className="mono" style={{ fontSize: 16, color: 'var(--text-3)' }}>{symbol}</span>
        </div>
        <input
          className="loan-slider"
          type="range"
          min={MIN}
          max={MAX}
          step={1000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          style={sliderStyle}
          aria-label="Сума кредиту"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span className="mono text-3" style={{ fontSize: 10 }}>{formatAmount(MIN)}</span>
          <span className="mono text-3" style={{ fontSize: 10 }}>{formatAmount(MAX)}</span>
        </div>

        {/* term chips */}
        <p className="mono-cap" style={{ marginTop: 18 }}>Термін</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {TERMS.map((t) => (
            <button
              key={t}
              onClick={() => setTerm(t)}
              className="control"
              data-on={term === t ? '' : undefined}
              style={{ flex: 1, padding: '10px 0', borderRadius: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5 }}
            >
              {term === t && <span className="sheen" />}
              <span className="control-content">{t}</span>
            </button>
          ))}
        </div>
        <p className="t-caption text-3" style={{ textAlign: 'center', marginTop: 6 }}>місяців</p>

        {/* readout */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: 'linear-gradient(160deg,#141418,#0E0E12)', border: `1px solid ${toRgba(accentRgb, 0.3)}`, boxShadow: `0 0 0 3px ${toRgba(accentRgb, 0.05)}`, transition: 'border-color 240ms ease-out' }}>
          <p className="mono-cap">Щомісячний платіж</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 40, letterSpacing: '-0.02em', color: accent, transition: 'color 240ms ease-out' }}>
              {calc ? formatAmount(animatedMonthly) : '—'}
            </span>
            <span className="mono" style={{ fontSize: 22, color: toRgba(accentRgb, 0.6) }}>{symbol}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <Meta label="Ставка" value={calc ? `${normRate(calc.annualRate)}%` : '—'} />
            <Meta label="Переплата" value={calc ? `${formatAmount(calc.totalInterest)} ${symbol}` : '—'} />
            <Meta label="Разом" value={calc ? `${formatAmount(calc.totalToRepay)} ${symbol}` : '—'} align="right" />
          </div>
        </div>

        {/* trust */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, color: 'var(--text-2)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} strokeWidth={1.9} /><span className="t-caption">Без прихованих комісій</span></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} strokeWidth={1.9} /><span className="t-caption">Прозорий графік</span></span>
        </div>
      </div>

      {/* account picker */}
      <p className="mono-cap" style={{ margin: '20px 4px 10px' }}>Зарахувати на рахунок</p>
      <div className="surface" style={{ padding: '4px 14px' }}>
        {accounts.map((a, i) => {
          const sel = account?.id === a.id
          return (
            <div key={a.id}>
              {i > 0 && <div className="hairline-top" />}
              <button onClick={() => setAccountId(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 2px' }}>
                <FlagBadge currency={a.currency} size={36} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="mono num-value">{a.currency}</div>
                  <div className="t-caption text-3" style={{ marginTop: 2 }}>Баланс {formatAmount(a.balance)}</div>
                </div>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sel && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* CTA — the desire button (colored, warm-shift) */}
      <button
        onClick={() => { setAgree(false); setConfirmOpen(true) }}
        disabled={!calc}
        className="control"
        style={{
          marginTop: 22,
          width: '100%',
          minHeight: 54,
          borderRadius: 'var(--r-field)',
          border: 'none',
          color: '#0A0A0C',
          fontWeight: 700,
          fontSize: 15.5,
          background: `linear-gradient(180deg, ${accent}, ${toRgb(warmerRgb)})`,
          boxShadow: `0 12px 32px ${toRgba(accentRgb, 0.4)}, inset 0 1px 0 rgba(255,255,255,.6)`,
          opacity: calc ? 1 : 0.5,
          animation: highCommit ? 'commit-pulse 1.8s ease-in-out infinite' : undefined,
          transition: 'background 240ms ease-out, box-shadow 240ms ease-out',
        }}
      >
        <span className="control-content">Оформити кредит</span>
      </button>

      {/* confirm sheet */}
      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="t-title" style={{ marginBottom: 4 }}>Підтвердження</h2>
        <p className="mono-cap" style={{ marginTop: 8 }}>Ви отримаєте на рахунок</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
          <span className="mono" style={{ fontWeight: 700, fontSize: 30, color: 'var(--text-1)' }}>{formatAmount(amount)}</span>
          <span className="mono" style={{ fontSize: 18, color: 'var(--text-3)' }}>{symbol}</span>
        </div>

        {calc && (
          <div className="surface" style={{ padding: '4px 16px', marginBottom: 16 }}>
            <SumRow label="Термін" value={`${term} міс`} />
            <div className="hairline-top" /><SumRow label="Щомісячний платіж" value={`${formatAmount(calc.monthlyPayment)} ${symbol}`} />
            <div className="hairline-top" /><SumRow label="Перший платіж" value={`≈ ${formatDateShort(nextMonthIso())}`} />
            <div className="hairline-top" /><SumRow label="Ставка" value={`${normRate(calc.annualRate)}%`} />
            <div className="hairline-top" /><SumRow label="Переплата" value={`${formatAmount(calc.totalInterest)} ${symbol}`} />
            <div className="hairline-top" /><SumRow label="Разом до сплати" value={`${formatAmount(calc.totalToRepay)} ${symbol}`} strong />
          </div>
        )}

        <button onClick={() => setAgree((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', marginBottom: 16 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${agree ? 'transparent' : 'var(--border)'}`, background: agree ? 'linear-gradient(180deg,#FFFFFF,#E4E8EE)' : 'transparent' }}>
            {agree && <Check size={15} strokeWidth={2.5} color="#0A0A0C" />}
          </span>
          <span className="t-caption text-2">Погоджуюсь з умовами кредитування та графіком платежів</span>
        </button>

        <Button fullWidth loading={busy} disabled={!agree} onClick={confirm}>Підтвердити та отримати</Button>
      </Sheet>

      {taken && <LoanSuccess loan={taken} symbol={symbol} onDone={() => navigate(`/loans/${taken.id}`, { replace: true })} />}
    </div>
  )
}

function Meta({ label, value, align }: { label: string; value: string; align?: 'right' }) {
  return (
    <div style={{ textAlign: align ?? 'left' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginTop: 3 }}>{value}</div>
    </div>
  )
}

function SumRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 2px' }}>
      <span className="t-label text-2">{label}</span>
      <span className={strong ? 'mono num-value' : 't-label'} style={{ color: 'var(--text-1)', fontWeight: strong ? 700 : 600 }}>{value}</span>
    </div>
  )
}

function LoanSuccess({ loan, symbol, onDone }: { loan: LoanResponse; symbol: string; onDone: () => void }) {
  const animated = useCountUp(loan.principal, 900)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 'var(--app-max)', background: 'linear-gradient(178deg,#131210,#0A0A0C)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'fade-in 220ms ease-out' }}>
        <Nova state="success" size={120} />
        <div className="mono" style={{ fontWeight: 700, fontSize: 44, color: 'var(--paid)', marginTop: 26 }}>
          +{formatAmount(animated)} {symbol}
        </div>
        <p className="t-body text-2" style={{ marginTop: 8, textAlign: 'center' }}>Кредит зараховано на рахунок</p>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 14, textAlign: 'center' }}>
          Платіж {formatAmount(loan.monthlyPayment)} {symbol}/міс · перший до {formatDateShort(loan.nextPaymentDate)}
        </div>
        <Button onClick={onDone} fullWidth style={{ marginTop: 34, maxWidth: 280 }}>До моїх кредитів</Button>
      </div>
    </div>
  )
}

function nextMonthIso(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString()
}
