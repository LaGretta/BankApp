import { Ban, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { blockCard, getCard } from '../api/cards'
import { BankCard } from '../components/BankCard'
import { Button } from '../components/Button'
import { CardSkeleton } from '../components/Skeleton'
import { ErrorScreen } from '../components/StateScreen'
import { Sheet } from '../components/Sheet'
import { TopBar } from '../components/TopBar'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../lib/apiClient'
import { NUM_TO_TIER, TIER_LABEL } from '../lib/enums'
import { formatExpiry, last4 } from '../lib/format'
import { toast } from '../store/toastStore'

export function CardDetail() {
  const { id } = useParams()
  const cardId = Number(id)
  const { data: card, loading, error, reload, setData } = useAsync(() => getCard(cardId), [cardId])
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const tier = card ? (NUM_TO_TIER[card.cardType] ?? 'White') : 'White'

  async function doBlock() {
    setBusy(true)
    try {
      const updated = await blockCard(cardId)
      setData(updated)
      setConfirm(false)
      toast.success('Картку заблоковано')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося заблокувати картку')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <TopBar back title="Картка" />

      {loading ? (
        <CardSkeleton />
      ) : error || !card ? (
        <ErrorScreen
          message={error ?? 'Картку не знайдено'}
          action={<Button variant="ghost" onClick={() => reload()}>Повторити</Button>}
        />
      ) : (
        <>
          <BankCard
            tier={tier}
            number={card.number}
            holderName={card.holderName}
            expiryDate={card.expiryDate}
            isActive={card.isActive}
          />

          <div className="surface" style={{ marginTop: 18, padding: '6px 16px' }}>
            <InfoRow label="Тип картки" value={TIER_LABEL[tier]} />
            <div className="hairline-top" />
            <InfoRow label="Власник" value={card.holderName || '—'} />
            <div className="hairline-top" />
            <InfoRow label="Останні цифри" value={`•• ${last4(card.number)}`} mono />
            <div className="hairline-top" />
            <InfoRow label="Дійсна до" value={formatExpiry(card.expiryDate)} mono />
            <div className="hairline-top" />
            <InfoRow
              label="Статус"
              value={card.isActive ? 'Активна' : 'Заблокована'}
              valueColor={card.isActive ? 'var(--positive)' : 'var(--negative)'}
            />
          </div>

          {card.isActive ? (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setConfirm(true)}
              style={{ marginTop: 16, color: 'var(--negative)', borderColor: 'rgba(224,128,143,.3)' }}
            >
              <Ban size={18} strokeWidth={1.9} /> Заблокувати картку
            </Button>
          ) : (
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px',
                borderRadius: 'var(--r-field)',
                border: '1px solid var(--hairline)',
                color: 'var(--text-3)',
              }}
            >
              <ShieldCheck size={18} strokeWidth={1.9} />
              <span className="t-label">Картку заблоковано</span>
            </div>
          )}
        </>
      )}

      <Sheet open={confirm} onClose={() => setConfirm(false)}>
        <h2 className="t-title" style={{ marginBottom: 6 }}>
          Заблокувати картку?
        </h2>
        <p className="t-body text-2" style={{ marginBottom: 20 }}>
          Картку •• {card ? last4(card.number) : ''} буде заблоковано. Операції за нею стануть
          недоступними.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            fullWidth
            loading={busy}
            onClick={doBlock}
            style={{ background: 'linear-gradient(180deg,#E0808F,#c96676)', color: '#fff' }}
          >
            Так, заблокувати
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setConfirm(false)} disabled={busy}>
            Скасувати
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
  valueColor,
}: {
  label: string
  value: string
  mono?: boolean
  valueColor?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 2px' }}>
      <span className="t-label text-2">{label}</span>
      <span
        className={mono ? 'mono num-value' : 't-label'}
        style={{ color: valueColor ?? 'var(--text-1)', fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  )
}
