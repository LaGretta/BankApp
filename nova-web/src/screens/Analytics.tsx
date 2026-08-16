import { ArrowDownLeft, ArrowUpRight, CreditCard, LineChart, PlusCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAnalytics } from '../api/analytics'
import { Button } from '../components/Button'
import { Nova } from '../components/Nova'
import { Skeleton } from '../components/Skeleton'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { formatAmount } from '../lib/format'
import type { AnalyticsPeriod, AnalyticsResponse } from '../lib/types'

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'month', label: 'Місяць' },
  { key: 'year', label: 'Рік' },
  { key: 'all', label: 'Весь час' },
]

const TYPE_META: Record<string, { name: string; accent: string; icon: LucideIcon }> = {
  Transfer: { name: 'Перекази', accent: '#C4CDD4', icon: ArrowUpRight },
  TopUp: { name: 'Поповнення', accent: '#9FE9DC', icon: PlusCircle },
  Loan: { name: 'Кредити', accent: '#E8B27A', icon: CreditCard },
  Payment: { name: 'Оплати', accent: '#C4CDD4', icon: CreditCard },
  Withdrawal: { name: 'Зняття', accent: '#E8B27A', icon: ArrowUpRight },
}
const typeMeta = (t: string) => TYPE_META[t] ?? { name: t, accent: '#C4CDD4', icon: CreditCard }

export function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')
  const { data, loading, error, reload } = useAsync(() => getAnalytics(period), [period])

  return (
    <div>
      <TopBar back title="Аналітика" right={<LineChart size={20} strokeWidth={1.9} color="var(--text-3)" />} />

      {/* period segmented */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: '#0E0E11', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, marginBottom: 18 }}>
        {PERIODS.map((p) => {
          const sel = period === p.key
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                color: sel ? '#0A0A0C' : 'var(--text-2)',
                background: sel ? 'linear-gradient(180deg,#F4F5F7,#DADEE4)' : 'transparent',
                transition: 'all 160ms ease-out',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <>
          <Skeleton height={70} radius={14} style={{ marginBottom: 16 }} />
          <Skeleton height={190} radius={20} style={{ marginBottom: 16 }} />
          <Skeleton height={80} radius={16} />
        </>
      ) : error ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Nova state="error" size={84} />
          <p className="t-body text-2" style={{ marginTop: 14 }}>{error}</p>
          <Button variant="ghost" onClick={() => reload()} style={{ marginTop: 16 }}>Повторити</Button>
        </div>
      ) : data ? (
        <Content data={data} period={period} />
      ) : null}
    </div>
  )
}

function Content({ data, period }: { data: AnalyticsResponse; period: AnalyticsPeriod }) {
  const empty =
    data.totalSpent === 0 && data.totalReceived === 0 && !data.chart.some((c) => c.spent || c.received)

  if (empty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px', gap: 8 }}>
        <Nova state="empty" size={104} />
        <h3 className="t-title" style={{ marginTop: 8 }}>Ще немає даних</h3>
        <p className="t-body text-2" style={{ maxWidth: 260, lineHeight: 1.5 }}>
          Зробіть кілька операцій — і Nova покаже вашу аналітику тут.
        </p>
      </div>
    )
  }

  const periodLabel = period === 'month' ? 'цей місяць' : period === 'year' ? String(new Date().getFullYear()) : 'весь час'
  const net = data.net
  const maxSplit = Math.max(data.totalReceived, data.totalSpent, 1)
  const maxBreakdown = Math.max(...data.breakdown.map((b) => b.amount), 1)

  return (
    <>
      {/* net-flow hero */}
      <div style={{ marginBottom: 18 }}>
        <p className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>Чистий потік · {periodLabel}</p>
        <div className="mono" style={{ fontWeight: 700, fontSize: 34, letterSpacing: '-0.02em', marginTop: 4 }}>
          <span style={{ color: net >= 0 ? 'var(--pos)' : 'var(--neg)' }}>{net >= 0 ? '+' : '−'}{formatAmount(Math.abs(net))}</span>
          <span style={{ color: 'var(--text-3)', fontSize: 18, marginLeft: 4 }}>₴</span>
        </div>
      </div>

      {/* main chart */}
      <GroupedChart chart={data.chart} />

      {/* spent vs received split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
        <StatCard label="Надходження" icon={ArrowDownLeft} iconColor="var(--pos)" value={data.totalReceived} pct={100} from="#4A555C" to="#9FE9DC" />
        <StatCard label="Витрати" icon={ArrowUpRight} iconColor="var(--neg)" value={data.totalSpent} pct={Math.round((data.totalSpent / maxSplit) * 100)} from="#5A5240" to="#E8B27A" />
      </div>

      {/* by-type breakdown */}
      {data.breakdown.length > 0 && (
        <>
          <h2 className="t-title" style={{ margin: '24px 4px 12px' }}>За типом операцій</h2>
          <div className="surface" style={{ padding: '6px 16px' }}>
            {data.breakdown.map((b, i) => {
              const m = typeMeta(b.type)
              const Icon = m.icon
              const share = Math.round((b.amount / maxBreakdown) * 100)
              return (
                <div key={b.type} style={{ padding: '12px 0', borderTop: i > 0 ? '1px solid var(--hairline)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#1a1a1f,#131316)', border: '1px solid var(--hairline)', color: 'var(--text-2)' }}>
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    <span className="t-label" style={{ flex: 1, fontWeight: 600, color: 'var(--text-1)' }}>{m.name}</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{formatAmount(b.amount)} ₴</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: '#0E0E11', marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${share}%`, borderRadius: 3, background: `linear-gradient(90deg,#4A555C,${m.accent})`, transition: prefersReduced ? 'none' : 'width 600ms cubic-bezier(.22,1,.36,1)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <p className="t-caption text-3" style={{ textAlign: 'center', marginTop: 16 }}>Усі суми в ₴ (конвертовано за курсом)</p>
    </>
  )
}

function StatCard({ label, icon: Icon, iconColor, value, pct, from, to }: { label: string; icon: LucideIcon; iconColor: string; value: number; pct: number; from: string; to: string }) {
  return (
    <div className="surface" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>
        <Icon size={15} strokeWidth={2} color={iconColor} />
        <span className="t-caption">{label}</span>
      </div>
      <div className="mono" style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-1)', marginTop: 6 }}>{formatAmount(value)} <span style={{ color: 'var(--text-3)', fontSize: 12 }}>₴</span></div>
      <div style={{ height: 6, borderRadius: 3, background: '#0E0E11', marginTop: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(2, pct)}%`, borderRadius: 3, background: `linear-gradient(90deg,${from},${to})`, transition: prefersReduced ? 'none' : 'width 600ms cubic-bezier(.22,1,.36,1)' }} />
      </div>
    </div>
  )
}

/* ---------------- grouped bars (received + spent per label) ---------------- */
function GroupedChart({ chart }: { chart: AnalyticsResponse['chart'] }) {
  const [revealed, setRevealed] = useState(prefersReduced)
  const [active, setActive] = useState<number | null>(null)
  useEffect(() => {
    if (prefersReduced) return
    const id = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const VB_W = 320
  const VB_H = 168
  const padL = 6
  const padR = 6
  const padT = 10
  const padB = 24
  const plotW = VB_W - padL - padR
  const plotH = VB_H - padT - padB
  const baseline = padT + plotH
  const n = Math.max(chart.length, 1)
  const max = Math.max(...chart.flatMap((c) => [c.spent, c.received]), 1)
  const slotW = plotW / n
  const groupW = Math.min(slotW * 0.62, 26)
  const barW = Math.max(2, (groupW - 3) / 2)
  const labelEvery = Math.ceil(n / 8)

  const gridlines = [0, 0.25, 0.5, 0.75, 1].map((f) => padT + plotH * f)
  const activeCur = active ?? n - 1

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ padding: 14, borderRadius: 20, background: 'linear-gradient(165deg,#161619,#0E0E12)', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 12px 30px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05)' }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ display: 'block', animation: prefersReduced ? undefined : 'fade-in 600ms ease-out' }}>
          <defs>
            <linearGradient id="recBar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#4A555C" /><stop offset="1" stopColor="#9FE9DC" /></linearGradient>
            <linearGradient id="spBar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#5A5240" /><stop offset="1" stopColor="#E8B27A" /></linearGradient>
          </defs>

          {gridlines.map((y, i) => (
            <line key={i} x1={padL} y1={y} x2={VB_W - padR} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth={1} />
          ))}

          {chart.map((c, i) => {
            const cx = padL + slotW * i + slotW / 2
            const rH = revealed ? (c.received / max) * plotH : 0
            const sH = revealed ? (c.spent / max) * plotH : 0
            const x0 = cx - groupW / 2
            const trans = prefersReduced ? 'none' : 'height 650ms cubic-bezier(.22,1,.36,1), y 650ms cubic-bezier(.22,1,.36,1)'
            return (
              <g key={i}>
                {i === activeCur && (
                  <rect x={cx - slotW / 2} y={padT} width={slotW} height={plotH} fill="rgba(127,230,214,.06)" rx={4} />
                )}
                <rect x={x0} y={baseline - rH} width={barW} height={rH} rx={2} fill="url(#recBar)" style={{ transition: trans }} />
                <rect x={x0 + barW + 3} y={baseline - sH} width={barW} height={sH} rx={2} fill="url(#spBar)" style={{ transition: trans }} />
                {/* hit area */}
                <rect x={cx - slotW / 2} y={padT} width={slotW} height={plotH + padB} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => setActive(i)} />
                {(i % labelEvery === 0 || i === n - 1) && (
                  <text x={cx} y={VB_H - 8} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: i === activeCur ? '#7FE6D6' : '#55585F' }}>
                    {shortLabel(c.label)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8 }}>
          <Legend color="#9FE9DC" label="Надходження" />
          <Legend color="#E8B27A" label="Витрати" />
        </div>
      </div>

      {/* tooltip */}
      {active != null && chart[active] && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: `${Math.min(78, Math.max(4, ((padL + slotW * active + slotW / 2) / VB_W) * 100))}%`,
            transform: 'translateX(-50%)',
            background: '#1A1A1F',
            border: '1px solid rgba(127,230,214,.3)',
            borderRadius: 10,
            padding: '8px 11px',
            pointerEvents: 'none',
            zIndex: 2,
            whiteSpace: 'nowrap',
          }}
        >
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{chart[active].label}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--pos)' }}>+{formatAmount(chart[active].received)} ₴</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--neg)' }}>−{formatAmount(chart[active].spent)} ₴</div>
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      <span className="t-caption text-3">{label}</span>
    </span>
  )
}

/** «2026-08» → «08»; «16» лишаємо. */
function shortLabel(label: string): string {
  const m = label.match(/^\d{4}-(\d{2})$/)
  return m ? m[1] : label
}
