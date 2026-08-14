import { ChevronRight, Plus } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJars } from '../api/jars'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { FlagBadge } from '../components/FlagBadge'
import { LiquidJar } from '../components/LiquidJar'
import { PullToRefresh } from '../components/PullToRefresh'
import { Skeleton } from '../components/Skeleton'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { useCountUp } from '../hooks/useCountUp'
import { CURRENCY_SYMBOL, type CurrencyCode } from '../lib/enums'
import { formatAmount } from '../lib/format'
import { jarIcon } from '../lib/jarCategories'
import { jarPercent } from '../lib/jarMath'
import type { JarResponse } from '../lib/types'

export function Savings() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => getJars(), [])
  const jars = useMemo(() => (data ?? []).filter((j) => !j.isClosed), [data])

  const refresh = useCallback(async () => {
    await reload({ silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // «Разом накопичено» — головна валюта + пігулки інших (FX немає, лише групуємо)
  const primary: CurrencyCode = jars.find((j) => j.currency === 'UAH')
    ? 'UAH'
    : (jars[0]?.currency ?? 'UAH')
  const heroTotal = jars.filter((j) => j.currency === primary).reduce((s, j) => s + j.currentAmount, 0)
  const others = Object.entries(
    jars
      .filter((j) => j.currency !== primary)
      .reduce<Record<string, number>>((acc, j) => {
        acc[j.currency] = (acc[j.currency] ?? 0) + j.currentAmount
        return acc
      }, {}),
  )
  const animated = useCountUp(heroTotal)

  return (
    <PullToRefresh onRefresh={refresh}>
      <TopBar
        title="Накопичення"
        subtitle={jars.length > 0 ? `${jars.length} ${pluralJars(jars.length)}` : undefined}
        right={
          jars.length > 0 ? (
            <button
              aria-label="Нова банка"
              onClick={() => navigate('/jars/new')}
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
          <Skeleton height={120} radius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={92} radius={18} style={{ marginBottom: 10 }} />
          <Skeleton height={92} radius={18} />
        </>
      ) : error ? (
        <EmptyState title="Не вдалося завантажити" subtitle={error} action={<Button fullWidth onClick={() => reload()}>Повторити</Button>} />
      ) : jars.length === 0 ? (
        <EmptyState
          title="Створіть першу банку"
          subtitle="Відкладайте на ціль — банка наповнюється, коли ви поповнюєте її з рахунку."
          action={<Button fullWidth onClick={() => navigate('/jars/new')}><Plus size={18} strokeWidth={1.9} /> Нова банка</Button>}
        />
      ) : (
        <>
          {/* hero total */}
          <div
            className="surface"
            style={{
              background: 'linear-gradient(160deg,#1C1B22,#100F14)',
              boxShadow: 'var(--e3), 0 0 60px rgba(127,230,214,.05)',
              borderRadius: 'var(--r-card)',
              padding: '22px 20px',
            }}
          >
            <p className="mono-cap">Разом накопичено</p>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="num-balance">{formatAmount(animated)}</span>
              <span className="num-balance" style={{ color: 'var(--text-3)', fontSize: 24 }}>
                {CURRENCY_SYMBOL[primary]}
              </span>
            </div>
            {others.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {others.map(([code, sum]) => (
                  <span
                    key={code}
                    className="mono"
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', padding: '5px 10px', borderRadius: 999, border: '1px solid var(--hairline)', background: 'var(--s1)' }}
                  >
                    {formatAmount(sum)} {CURRENCY_SYMBOL[code as CurrencyCode]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* jar list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {jars.map((jar) => (
              <JarCard key={jar.id} jar={jar} onClick={() => navigate(`/jars/${jar.id}`)} />
            ))}
          </div>
        </>
      )}
    </PullToRefresh>
  )
}

function JarCard({ jar, onClick }: { jar: JarResponse; onClick: () => void }) {
  const pct = jarPercent(jar)
  const Icon = jarIcon(jar.iconKey)

  return (
    <button
      onClick={onClick}
      className="surface"
      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--r-tile)' }}
    >
      <LiquidJar percent={pct} width={52} height={70} showLines={false} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <Icon size={16} strokeWidth={1.9} color="var(--text-2)" style={{ flexShrink: 0 }} />
          <span className="t-title" style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {jar.name}
          </span>
        </div>
        <div className="mono" style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
          {formatAmount(jar.currentAmount)} / {formatAmount(jar.targetAmount)} {jar.currency}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <FlagBadge currency={jar.currency} size={30} />
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#9FE9DC' }}>
          {Math.round(pct)}%
        </span>
      </div>
      <ChevronRight size={18} strokeWidth={1.9} color="var(--text-3)" style={{ marginLeft: 2 }} />
    </button>
  )
}

function pluralJars(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'банка'
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'банки'
  return 'банок'
}
