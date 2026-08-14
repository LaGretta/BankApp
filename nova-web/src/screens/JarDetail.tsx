import { ArrowDownLeft, ArrowUpRight, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { closeJar, depositToJar, getJar, getJarHistory, withdrawFromJar } from '../api/jars'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { LiquidJar } from '../components/LiquidJar'
import { Nova } from '../components/Nova'
import { CardSkeleton } from '../components/Skeleton'
import { Sheet } from '../components/Sheet'
import { ErrorScreen } from '../components/StateScreen'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { CURRENCY_SYMBOL } from '../lib/enums'
import { formatAmount, formatDateShort } from '../lib/format'
import { jarIcon } from '../lib/jarCategories'
import { amountLeft, daysLeft, jarPercent, jarStage, pluralDays } from '../lib/jarMath'
import { newGuid } from '../lib/idempotency'
import type { JarTransaction } from '../lib/types'
import { toast } from '../store/toastStore'

type Action = 'deposit' | 'withdraw' | null

export function JarDetail() {
  const { id } = useParams()
  const jarId = Number(id)
  const navigate = useNavigate()
  const { data: jar, loading, error, reload, setData } = useAsync(() => getJar(jarId), [jarId])
  const historyQ = useAsync(() => getJarHistory(jarId), [jarId])

  const [action, setAction] = useState<Action>(null)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [closeAsk, setCloseAsk] = useState(false)
  const [closing, setClosing] = useState(false)
  const idemKey = useRef(newGuid())

  // новий idem-ключ на нову суму/дію; ретрай тієї ж — той самий ключ
  useEffect(() => {
    idemKey.current = newGuid()
  }, [action, amount])

  function openAction(a: Action) {
    setAmount('')
    setAction(a)
  }

  const symbol = jar ? CURRENCY_SYMBOL[jar.currency] : ''
  const amountNum = Number(amount.replace(',', '.'))
  const validAmount =
    amountNum > 0 && (action !== 'withdraw' || (jar ? amountNum <= jar.currentAmount : false))

  async function submitAction() {
    if (!jar || !action) return
    setBusy(true)
    try {
      const updated =
        action === 'deposit'
          ? await depositToJar(jar.id, amountNum, idemKey.current)
          : await withdrawFromJar(jar.id, amountNum, idemKey.current)
      setData(updated)
      await historyQ.reload({ silent: true })
      setAction(null)
      toast.success(action === 'deposit' ? 'Банку поповнено' : 'Кошти знято')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Операція не виконана')
    } finally {
      setBusy(false)
    }
  }

  async function doClose() {
    if (!jar) return
    setClosing(true)
    try {
      await closeJar(jar.id)
      toast.success('Банку розбито — кошти повернулись на рахунок')
      navigate('/savings', { replace: true })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося розбити банку')
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar back title="Банка" />
        <CardSkeleton />
      </div>
    )
  }
  if (error || !jar) {
    return (
      <div>
        <TopBar back title="Банка" />
        <ErrorScreen message={error ?? 'Банку не знайдено'} action={<Button variant="ghost" onClick={() => reload()}>Повторити</Button>} />
      </div>
    )
  }

  const pct = jarPercent(jar)
  const stage = jarStage(pct)
  const left = amountLeft(jar)
  const days = daysLeft(jar.targetDate)
  const full = pct >= 100
  const Icon = jarIcon(jar.iconKey)

  return (
    <div>
      <TopBar
        back
        title={jar.name}
        right={<Icon size={20} strokeWidth={1.9} color="var(--text-3)" />}
      />

      {/* hero jar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
        {full && (
          <div style={{ marginBottom: -6 }}>
            <Nova state="success" size={72} />
          </div>
        )}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <LiquidJar percent={pct} width={150} height={200} showLines showLabels celebrate />
          {/* overlay поточної суми на банці */}
          <div style={{ position: 'absolute', top: '42%', left: 0, width: 150, textAlign: 'center', pointerEvents: 'none' }}>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', textShadow: '0 1px 8px rgba(0,0,0,.6)' }}>
              {formatAmount(jar.currentAmount)}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>
              з {formatAmount(jar.targetAmount)} {jar.currency}
            </div>
          </div>
        </div>
      </div>

      {/* stage + left/days */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 4px 16px', gap: 10 }}>
        <span className="t-label" style={{ color: 'var(--text-1)', fontWeight: 600 }}>
          Стадія {stage} · <span style={{ color: '#9FE9DC' }}>{Math.round(pct)}%</span>
        </span>
        <span className="t-caption text-3" style={{ textAlign: 'right' }}>
          {full ? 'Ціль досягнута 🎉' : `Залишилось ${formatAmount(left)} ${jar.currency}`}
          {days != null && !full ? ` · ${days} ${pluralDays(days)}` : ''}
        </span>
      </div>

      {/* actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Button onClick={() => openAction('deposit')} disabled={jar.isClosed}>
          <Plus size={18} strokeWidth={1.9} /> Поповнити
        </Button>
        <Button variant="ghost" onClick={() => openAction('withdraw')} disabled={jar.isClosed || jar.currentAmount <= 0}>
          <Minus size={18} strokeWidth={1.9} /> Зняти
        </Button>
      </div>

      {/* history */}
      <h2 className="t-title" style={{ margin: '26px 4px 12px' }}>Історія банки</h2>
      <div className="surface" style={{ padding: '4px 14px' }}>
        {historyQ.loading ? (
          <p className="t-label text-3" style={{ padding: '16px 6px' }}>Завантаження…</p>
        ) : (historyQ.data?.length ?? 0) === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '24px 0' }}>
            <Nova state="empty" size={72} />
            <p className="t-label text-3">Операцій ще немає</p>
          </div>
        ) : (
          historyQ.data!.map((h, i) => <HistoryRow key={h.id} h={h} currency={jar.currency} first={i === 0} />)
        )}
      </div>

      {/* close */}
      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <button onClick={() => setCloseAsk(true)} className="t-label" style={{ color: 'var(--text-3)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Розбити банку
        </button>
      </div>

      {/* deposit / withdraw sheet */}
      <Sheet open={action !== null} onClose={() => setAction(null)}>
        <h2 className="t-title" style={{ marginBottom: 6 }}>
          {action === 'deposit' ? 'Поповнити банку' : 'Зняти з банки'}
        </h2>
        <p className="t-body text-2" style={{ marginBottom: 18 }}>
          {action === 'deposit'
            ? 'Кошти перейдуть з рахунку до банки.'
            : `Кошти повернуться на рахунок. Доступно: ${formatAmount(jar.currentAmount)} ${jar.currency}.`}
        </p>
        <Field
          label="Сума"
          placeholder="0.00"
          inputMode="decimal"
          value={amount}
          autoFocus
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
          suffix={<span className="mono text-3" style={{ fontWeight: 600 }}>{symbol}</span>}
          error={amount !== '' && amountNum <= 0 ? 'Введіть суму більшу за 0' : action === 'withdraw' && amount !== '' && amountNum > jar.currentAmount ? 'Недостатньо коштів у банці' : undefined}
        />
        <Button fullWidth loading={busy} disabled={!validAmount} onClick={submitAction} style={{ marginTop: 16 }}>
          {action === 'deposit' ? 'Поповнити' : 'Зняти'}{validAmount ? ` ${amountNum.toFixed(2)} ${symbol}` : ''}
        </Button>
      </Sheet>

      {/* close confirm */}
      <Sheet open={closeAsk} onClose={() => setCloseAsk(false)}>
        <h2 className="t-title" style={{ marginBottom: 6 }}>Розбити банку?</h2>
        <p className="t-body text-2" style={{ marginBottom: 20 }}>
          Усі кошти ({formatAmount(jar.currentAmount)} {jar.currency}) повернуться на рахунок, а банку буде закрито. Дію не можна скасувати.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button fullWidth loading={closing} onClick={doClose} style={{ background: 'linear-gradient(180deg,#E0808F,#c96676)', color: '#fff' }}>
            Так, розбити банку
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setCloseAsk(false)} disabled={closing}>Скасувати</Button>
        </div>
      </Sheet>
    </div>
  )
}

function HistoryRow({ h, currency, first }: { h: JarTransaction; currency: string; first: boolean }) {
  const isDeposit = h.type === 'Deposit'
  const Icon = isDeposit ? ArrowDownLeft : ArrowUpRight
  return (
    <>
      {!first && <div className="hairline-top" />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 2px' }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#1a1a1f,#131316)', border: '1px solid var(--hairline)', color: isDeposit ? 'var(--positive)' : 'var(--text-2)' }}>
          <Icon size={18} strokeWidth={1.9} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-label" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{isDeposit ? 'Поповнення' : 'Зняття'}</div>
          <div className="t-caption text-3" style={{ marginTop: 2 }}>{formatDateShort(h.createdAt)}</div>
        </div>
        <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: isDeposit ? '#6FD8AE' : 'var(--text-1)' }}>
          {isDeposit ? '+' : '−'}{formatAmount(h.amount)} <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{currency}</span>
        </span>
      </div>
    </>
  )
}
