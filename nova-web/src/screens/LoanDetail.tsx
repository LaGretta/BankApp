import { AlertTriangle, Check, Circle } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLoan, getLoanSchedule, payLoan } from '../api/loans'
import { Amount } from '../components/Amount'
import { Button } from '../components/Button'
import { FlagBadge } from '../components/FlagBadge'
import { CardSkeleton, RowSkeleton } from '../components/Skeleton'
import { ErrorScreen } from '../components/StateScreen'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { formatAmount, formatDateShort } from '../lib/format'
import type { LoanPayment } from '../lib/types'
import { toast } from '../store/toastStore'

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function LoanDetail() {
  const { id } = useParams()
  const loanId = Number(id)
  const loanQ = useAsync(() => getLoan(loanId), [loanId])
  const schedQ = useAsync(() => getLoanSchedule(loanId), [loanId])
  const [paying, setPaying] = useState(false)

  const loan = loanQ.data
  const schedule = schedQ.data ?? []

  async function pay() {
    if (!loan) return
    setPaying(true)
    try {
      const updated = await payLoan(loan.id)
      loanQ.setData(updated)
      await schedQ.reload({ silent: true })
      toast.success('Платіж внесено')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося внести платіж')
    } finally {
      setPaying(false)
    }
  }

  if (loanQ.loading) {
    return <div><TopBar back title="Кредит" /><CardSkeleton /></div>
  }
  if (loanQ.error || !loan) {
    return <div><TopBar back title="Кредит" /><ErrorScreen message={loanQ.error ?? 'Кредит не знайдено'} action={<Button variant="ghost" onClick={() => loanQ.reload()}>Повторити</Button>} /></div>
  }

  const totalCount = schedule.length
  const paidCount = schedule.filter((p) => p.isPaid).length
  const total = schedule.reduce((s, p) => s + p.amount, 0)
  const paidPct = totalCount ? paidCount / totalCount : 0
  const isPaidOff = loan.status === 'Paid'
  const days = daysUntil(loan.nextPaymentDate)

  return (
    <div>
      <TopBar back title={`Кредит ${loan.currency}`} right={<FlagBadge currency={loan.currency} size={30} />} />

      {/* ring + hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
        <ProgressRing pct={paidPct} />
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <p className="mono-cap">Залишок боргу</p>
          <div style={{ marginTop: 6 }}><Amount value={loan.remainingBalance} currency={loan.currency} size={26} /></div>
          <p className="t-caption text-3 mono" style={{ marginTop: 6 }}>
            з {formatAmount(total)} {loan.currency} · {paidCount}/{totalCount} платежів
          </p>
        </div>
      </div>

      {/* next payment */}
      {!isPaidOff && (
        <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 16, background: 'linear-gradient(160deg,#141418,#0E0E12)', border: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="mono-cap">Наступний платіж</p>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginTop: 4 }}>
                {formatAmount(loan.monthlyPayment)} <span style={{ color: 'var(--text-3)', fontSize: 14 }}>{loan.currency}</span>
              </div>
              <p className="t-caption text-3" style={{ marginTop: 4 }}>
                до {formatDateShort(loan.nextPaymentDate)}{' '}
                {days < 0 ? (
                  <span style={{ color: 'var(--overdue)' }}>· прострочено на {Math.abs(days)} {pluralDays(Math.abs(days))}</span>
                ) : (
                  <span>· за {days} {pluralDays(days)}</span>
                )}
              </p>
            </div>
          </div>
          <Button fullWidth loading={paying} onClick={pay} style={{ marginTop: 14 }}>Сплатити</Button>
        </div>
      )}
      {isPaidOff && (
        <div style={{ marginTop: 20, padding: '16px', borderRadius: 16, border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--paid)', justifyContent: 'center' }}>
          <Check size={18} strokeWidth={2} /><span className="t-label" style={{ fontWeight: 600 }}>Кредит повністю погашено</span>
        </div>
      )}

      {/* schedule */}
      <h2 className="t-title" style={{ margin: '26px 4px 12px' }}>Графік платежів</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {schedQ.loading ? (
          <><RowSkeleton /><RowSkeleton /><RowSkeleton /></>
        ) : (
          schedule.map((p, i) => <ScheduleRow key={p.id} p={p} n={i + 1} currency={loan.currency} />)
        )}
      </div>
    </div>
  )
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 52
  const sw = 11
  const size = (r + sw) * 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(1, pct)))
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={sw} />
        <defs>
          <linearGradient id="loanArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5C6C74" />
            <stop offset="1" stopColor="#C4CDD4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#loanArc)"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: prefersReduced ? 'none' : 'stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: '#DCE6EA' }}>{Math.round(pct * 100)}%</span>
        <span className="t-caption text-3">сплачено</span>
      </div>
    </div>
  )
}

function ScheduleRow({ p, n, currency }: { p: LoanPayment; n: number; currency: string }) {
  const overdue = !p.isPaid && daysUntil(p.dueDate) < 0
  const bg = overdue ? 'var(--overdue-bg)' : '#0E0E11'
  const border = overdue ? 'var(--overdue-border)' : p.isPaid ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.06)'
  const amtColor = overdue ? 'var(--overdue)' : p.isPaid ? '#8A8D96' : '#55585F'

  const icon = p.isPaid ? (
    <Check size={17} strokeWidth={2} color="#B9C2CB" />
  ) : overdue ? (
    <AlertTriangle size={16} strokeWidth={1.9} color="var(--overdue)" />
  ) : (
    <Circle size={15} strokeWidth={1.9} color="#55585F" />
  )
  const statusLabel = p.isPaid ? formatDateShort(p.paidAt ?? p.dueDate) : overdue ? 'прострочено' : 'очікує'
  const statusColor = overdue ? 'var(--overdue)' : 'var(--text-3)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: bg, border: `1px solid ${border}` }}>
      <span style={{ width: 26, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
          {n}. {formatDateShort(p.dueDate)}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
          осн. {formatAmount(p.principalPart)} · % {formatAmount(p.interestPart)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: amtColor }}>{formatAmount(p.amount)} {currency}</div>
        <div className="t-caption" style={{ color: statusColor, marginTop: 1 }}>{statusLabel}</div>
      </div>
    </div>
  )
}

function daysUntil(iso: string): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  const ms = d.getTime() - Date.now()
  return Math.ceil(ms / (24 * 3600 * 1000))
}

function pluralDays(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'день'
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'дні'
  return 'днів'
}
