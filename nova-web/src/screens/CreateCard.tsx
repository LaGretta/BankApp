import { AlertTriangle, Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAccounts } from '../api/accounts'
import { createCard } from '../api/cards'
import { BankCard } from '../components/BankCard'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { FlagBadge } from '../components/FlagBadge'
import { Sheet } from '../components/Sheet'
import { RowSkeleton } from '../components/Skeleton'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import {
  NUM_TO_CURRENCY,
  TIERS,
  TIER_LABEL,
  type CardTier,
} from '../lib/enums'
import { groupCardNumber } from '../lib/format'
import type { CardCreated } from '../lib/types'
import { toast } from '../store/toastStore'

export function CreateCard() {
  const navigate = useNavigate()
  const location = useLocation()
  const preAccount = (location.state as { accountId?: number } | null)?.accountId
  const { data, loading } = useAsync(() => getAccounts(), [])
  const accounts = data ?? []

  const [accountId, setAccountId] = useState<number | null>(preAccount ?? null)
  const [tier, setTier] = useState<CardTier>('White')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<CardCreated | null>(null)
  const [copied, setCopied] = useState(false)

  const selected = accounts.find((a) => a.id === accountId) ?? accounts[0] ?? null
  const effectiveAccountId = accountId ?? selected?.id ?? null

  const previewName = 'NOVA CLIENT'
  const previewNumber = useMemo(() => '0000 0000 0000 0000', [])

  async function submit() {
    if (!effectiveAccountId) return
    setBusy(true)
    try {
      const card = await createCard(effectiveAccountId, tier)
      setCreated(card)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося випустити картку')
    } finally {
      setBusy(false)
    }
  }

  function finish() {
    const id = created?.id
    setCreated(null)
    toast.success('Картку випущено')
    if (id) navigate(`/cards/${id}`, { replace: true })
    else navigate('/accounts', { replace: true })
  }

  async function copyCvv() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.cvv)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <TopBar back title="Нова картка" />

      {loading ? (
        <div className="surface" style={{ padding: '4px 14px' }}>
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Спочатку рахунок"
          subtitle="Щоб випустити картку, відкрийте хоча б один рахунок."
          action={<Button fullWidth onClick={() => navigate('/accounts')}>До рахунків</Button>}
        />
      ) : (
        <>
          {/* live preview */}
          <BankCard
            tier={tier}
            number={previewNumber}
            holderName={previewName}
            expiryDate={new Date().toISOString()}
            interactive={false}
          />

          {/* tier picker */}
          <h2 className="t-title" style={{ margin: '24px 4px 12px' }}>
            Тип картки
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className="control"
                data-on={tier === t ? '' : undefined}
                style={{ flexDirection: 'column', padding: '12px 6px', borderRadius: 'var(--r-tile)' }}
              >
                {tier === t && <span className="sheen" />}
                <span className="control-content" style={{ flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      width: 26,
                      height: 18,
                      borderRadius: 4,
                      background:
                        t === 'White'
                          ? 'linear-gradient(155deg,#fff,#dfe3ea)'
                          : t === 'Black'
                            ? 'linear-gradient(155deg,#2a2a30,#0b0b0d)'
                            : 'linear-gradient(150deg,#cbd0da,#8a9099)',
                      border: '1px solid rgba(255,255,255,.25)',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{t}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="t-caption text-3" style={{ margin: '8px 4px 0' }}>
            {TIER_LABEL[tier]}
          </p>

          {/* account picker */}
          <h2 className="t-title" style={{ margin: '24px 4px 12px' }}>
            Рахунок картки
          </h2>
          <div className="surface" style={{ padding: '4px 14px' }}>
            {accounts.map((a, i) => {
              const code = NUM_TO_CURRENCY[a.currency] ?? 'UAH'
              const isSel = effectiveAccountId === a.id
              return (
                <div key={a.id}>
                  {i > 0 && <div className="hairline-top" />}
                  <button
                    onClick={() => setAccountId(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 2px' }}
                  >
                    <FlagBadge currency={code} size={38} />
                    <span className="mono num-value" style={{ flex: 1, textAlign: 'left' }}>
                      {code}
                    </span>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSel && (
                        <span
                          style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }}
                        />
                      )}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>

          <Button fullWidth loading={busy} onClick={submit} style={{ marginTop: 22 }}>
            Випустити картку {tier}
          </Button>
        </>
      )}

      {/* CVV — показуємо ОДИН раз */}
      <Sheet open={!!created} dismissable={false}>
        {created && (
          <>
            <h2 className="t-title" style={{ marginBottom: 6 }}>
              Картку створено
            </h2>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '11px 12px',
                borderRadius: 'var(--r-field)',
                background: 'rgba(224,128,143,.1)',
                border: '1px solid rgba(224,128,143,.3)',
                marginBottom: 18,
              }}
            >
              <AlertTriangle size={17} strokeWidth={1.9} color="var(--negative)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span className="t-caption" style={{ color: 'var(--text-1)', lineHeight: 1.4 }}>
                CVV показується <b>лише зараз</b>. Запишіть його — більше він не відображатиметься.
              </span>
            </div>

            <BankCard
              tier={tier}
              number={created.number}
              holderName={created.holderName}
              expiryDate={created.expiryDate}
              interactive={false}
            />

            <div className="surface" style={{ marginTop: 16, padding: '4px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 2px' }}>
                <span className="t-label text-2">Номер картки</span>
                <span className="mono num-value">{groupCardNumber(created.number)}</span>
              </div>
              <div className="hairline-top" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 2px' }}>
                <span className="t-label text-2">CVV</span>
                <button onClick={copyCvv} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono num-value" style={{ color: 'var(--accent)', letterSpacing: '0.14em' }}>
                    {created.cvv}
                  </span>
                  {copied ? (
                    <Check size={16} strokeWidth={2} color="var(--positive)" />
                  ) : (
                    <Copy size={16} strokeWidth={1.9} color="var(--text-3)" />
                  )}
                </button>
              </div>
            </div>

            <Button fullWidth onClick={finish} style={{ marginTop: 20 }}>
              Я записав CVV — готово
            </Button>
          </>
        )}
      </Sheet>
    </div>
  )
}
