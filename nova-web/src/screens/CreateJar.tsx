import { Calendar, Coins, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { createJar } from '../api/jars'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Field } from '../components/Field'
import { FlagBadge } from '../components/FlagBadge'
import { LiquidJar } from '../components/LiquidJar'
import { RowSkeleton } from '../components/Skeleton'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { CURRENCY_SYMBOL } from '../lib/enums'
import { formatAmount } from '../lib/format'
import { JAR_CATEGORIES } from '../lib/jarCategories'
import { toast } from '../store/toastStore'

export function CreateJar() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(() => getAccounts(), [])
  const accounts = data ?? []

  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [accountId, setAccountId] = useState<number | null>(null)
  const [iconKey, setIconKey] = useState<string>('plane')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (accountId === null && accounts.length) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  const account = accounts.find((a) => a.id === accountId) ?? accounts[0] ?? null
  const targetNum = Number(target.replace(',', '.'))
  const canSubmit = name.trim().length > 0 && targetNum > 0 && account != null

  async function submit() {
    if (!account) return
    setBusy(true)
    try {
      const jar = await createJar({
        accountId: account.id,
        name: name.trim(),
        iconKey,
        targetAmount: targetNum,
        targetDate: date ? new Date(date).toISOString() : null,
      })
      toast.success('Банку створено')
      navigate(`/jars/${jar.id}`, { replace: true })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося створити банку')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar back title="Нова банка" />
        <div className="surface" style={{ padding: '4px 14px' }}><RowSkeleton /><RowSkeleton /></div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div>
        <TopBar back title="Нова банка" />
        <EmptyState
          title="Спочатку рахунок"
          subtitle="Щоб створити банку, відкрийте хоча б один рахунок — валюта банки буде з нього."
          action={<Button fullWidth onClick={() => navigate('/accounts')}>До рахунків</Button>}
        />
      </div>
    )
  }

  return (
    <div>
      <TopBar back title="Нова банка" />

      {/* preview */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <LiquidJar percent={0} width={110} height={148} showLines />
        <p className="t-caption text-3">
          Ціль: {targetNum > 0 && account ? `${formatAmount(targetNum)} ${account.currency}` : '—'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Назва" placeholder="Напр. Подорож до Японії" icon={<Tag size={18} strokeWidth={1.9} />} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <Field
          label="Ціль"
          placeholder="0.00"
          inputMode="decimal"
          icon={<Coins size={18} strokeWidth={1.9} />}
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/[^\d.,]/g, ''))}
          suffix={<span className="mono text-3" style={{ fontWeight: 600 }}>{account ? CURRENCY_SYMBOL[account.currency] : ''}</span>}
        />

        {/* account picker (= валюта) */}
        <div>
          <p className="mono-cap" style={{ paddingLeft: 2, marginBottom: 8 }}>Рахунок банки</p>
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
        </div>

        {/* category picker */}
        <div>
          <p className="mono-cap" style={{ paddingLeft: 2, marginBottom: 8 }}>Категорія</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {JAR_CATEGORIES.map((c) => {
              const Icon = c.icon
              const sel = iconKey === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => setIconKey(c.key)}
                  className="control"
                  data-on={sel ? '' : undefined}
                  style={{ flexDirection: 'column', gap: 6, padding: '12px 4px', borderRadius: 'var(--r-tile)', color: sel ? undefined : 'var(--text-2)' }}
                  aria-label={c.label}
                >
                  {sel && <span className="sheen" />}
                  <span className="control-content" style={{ flexDirection: 'column', gap: 6 }}>
                    <Icon size={20} strokeWidth={1.9} />
                    <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* target date (optional) */}
        <Field label="Дата цілі (необовʼязково)" type="date" icon={<Calendar size={18} strokeWidth={1.9} />} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <Button fullWidth loading={busy} disabled={!canSubmit} onClick={submit} style={{ marginTop: 22 }}>
        Створити банку
      </Button>
    </div>
  )
}
