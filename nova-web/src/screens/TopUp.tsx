import { CreditCard } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { topUp } from '../api/transactions'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { SuccessOverlay } from '../components/SuccessOverlay'
import { TopBar } from '../components/TopBar'
import { ApiError } from '../lib/apiClient'
import { newGuid } from '../lib/idempotency'
import { toast } from '../store/toastStore'

export function TopUp() {
  const navigate = useNavigate()
  const [cardNumber, setCardNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const idemKey = useRef(newGuid())
  useEffect(() => {
    idemKey.current = newGuid()
  }, [cardNumber, amount])

  const digits = cardNumber.replace(/\s/g, '')
  const amountNum = Number(amount.replace(',', '.'))
  const validCard = digits.length >= 12 && digits.length <= 19
  const validAmount = amountNum > 0
  const canSubmit = validCard && validAmount

  async function submit() {
    setBusy(true)
    try {
      await topUp({ cardNumber: digits, amount: amountNum, idempotencyKey: idemKey.current })
      setDone(true)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Поповнення не виконано')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <TopBar back title="Поповнення" subtitle="Введіть номер картки, як у банкоматі" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px',
          borderRadius: 'var(--r-card)',
          background: 'linear-gradient(160deg,#1C1B22,#100F14)',
          border: '1px solid var(--hairline)',
          boxShadow: 'var(--e2), var(--lit)',
          marginBottom: 22,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--s3)',
            color: 'var(--accent)',
          }}
        >
          <CreditCard size={22} strokeWidth={1.9} />
        </span>
        <div>
          <p className="t-label" style={{ fontWeight: 600 }}>
            Поповнення картки
          </p>
          <p className="t-caption text-3" style={{ marginTop: 2 }}>
            Кошти зарахуються на рахунок картки
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <Field
          label="Номер картки"
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          icon={<CreditCard size={18} strokeWidth={1.9} />}
          value={cardNumber}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(0, 19)
            setCardNumber(d.replace(/(.{4})/g, '$1 ').trim())
          }}
          error={cardNumber !== '' && !validCard ? 'Некоректний номер картки' : undefined}
        />
        <Field
          label="Сума"
          placeholder="0.00"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
          error={amount !== '' && !validAmount ? 'Введіть суму більшу за 0' : undefined}
        />
      </div>

      <Button fullWidth loading={busy} disabled={!canSubmit} onClick={submit} style={{ marginTop: 22 }}>
        Поповнити{validAmount ? ` ${amountNum.toFixed(2)}` : ''}
      </Button>

      {done && (
        <SuccessOverlay
          title="Рахунок поповнено"
          subtitle={`${amountNum.toFixed(2)} зараховано на картку •• ${digits.slice(-4)}.`}
          onDone={() => navigate('/dashboard', { replace: true })}
        />
      )}
    </div>
  )
}
