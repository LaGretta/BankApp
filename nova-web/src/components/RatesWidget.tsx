import { ArrowRightLeft, ChevronRight, Info, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type CurrencyCode } from '../lib/enums'
import { formatAmount } from '../lib/format'
import { ageLabel, cachedRate, convert, fetchRate } from '../lib/rates'
import { FlagBadge } from './FlagBadge'
import { Sheet } from './Sheet'
import { Skeleton } from './Skeleton'

interface RateEntry {
  code: CurrencyCode
  name: string
  rate: number
}

const RATE_CODES: { code: CurrencyCode; name: string }[] = [
  { code: 'USD', name: 'Долар США' },
  { code: 'EUR', name: 'Євро' },
]

const fmtRate = (r: number) => r.toFixed(2)

export function RatesWidget() {
  const [entries, setEntries] = useState<RateEntry[] | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [fetchedAt, setFetchedAt] = useState(0)
  const [convCcy, setConvCcy] = useState<CurrencyCode | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all(RATE_CODES.map((c) => fetchRate(c.code)))
      .then((rates) => {
        if (!alive) return
        setEntries(RATE_CODES.map((c, i) => ({ code: c.code, name: c.name, rate: rates[i].rate })))
        setFetchedAt(Math.min(...rates.map((r) => r.fetchedAt)))
        setState('ok')
      })
      .catch(() => {
        if (alive) setState('error')
      })
    return () => {
      alive = false
    }
  }, [])

  // на помилку — просто ховаємо widget, Home не падає
  if (state === 'error') return null

  return (
    <section style={{ marginTop: 26 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
        <h2 className="t-title">Курси валют</h2>
        {state === 'ok' && (
          <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 10 }}>
            <RefreshCw size={12} strokeWidth={1.9} /> оновлено {ageLabel(fetchedAt)}
          </span>
        )}
      </div>

      {state === 'loading' ? (
        <>
          <Skeleton height={56} radius={14} style={{ marginBottom: 8 }} />
          <Skeleton height={56} radius={14} />
        </>
      ) : (
        entries!.map((e, i) => (
          <button
            key={e.code}
            onClick={() => setConvCcy(e.code)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              width: '100%',
              padding: '12px 14px',
              marginTop: i > 0 ? 8 : 0,
              background: 'linear-gradient(160deg,#161619,#0F0F12)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 14,
              textAlign: 'left',
            }}
          >
            <FlagBadge currency={e.code} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>{e.code}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{e.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{fmtRate(e.rate)}</span>
              <span className="mono" style={{ fontWeight: 500, fontSize: 10, color: 'var(--text-3)' }}> ₴</span>
            </div>
            <ChevronRight size={16} strokeWidth={1.9} color="var(--text-3)" />
          </button>
        ))
      )}

      {state === 'ok' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 11, color: 'var(--text-3)' }}>
          <Info size={11} strokeWidth={1.9} />
          <span style={{ fontSize: 10 }}>Курс НБУ, орієнтовний</span>
        </div>
      )}

      <ConverterSheet ccy={convCcy} onClose={() => setConvCcy(null)} />
    </section>
  )
}

/* ------------------ quick-converter bottom-sheet ------------------ */
function ConverterSheet({ ccy, onClose }: { ccy: CurrencyCode | null; onClose: () => void }) {
  const [swapped, setSwapped] = useState(false)
  const [amount, setAmount] = useState('100')

  // скидання при відкритті
  useEffect(() => {
    if (ccy) {
      setSwapped(false)
      setAmount('100')
    }
  }, [ccy])

  if (!ccy) return null

  const from: CurrencyCode = swapped ? 'UAH' : ccy
  const to: CurrencyCode = swapped ? ccy : 'UAH'
  const rFrom = cachedRate(from)?.rate ?? 1
  const rTo = cachedRate(to)?.rate ?? 1
  const amt = Number(amount.replace(',', '.')) || 0
  const result = convert(amt, rFrom, rTo)
  const oneUnitInUah = cachedRate(ccy)?.rate ?? 1

  return (
    <Sheet open={!!ccy} onClose={onClose}>
      <h2 className="t-title" style={{ marginBottom: 16 }}>Конвертер</h2>

      <div style={{ position: 'relative' }}>
        {/* from (editable) */}
        <div style={convField}>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
            inputMode="decimal"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}
          />
          <span className="mono" style={{ fontSize: 15, color: 'var(--text-3)', fontWeight: 600 }}>{from}</span>
        </div>

        {/* swap disc */}
        <button
          onClick={() => setSwapped((s) => !s)}
          aria-label="Поміняти напрям"
          style={{
            position: 'absolute',
            top: '50%',
            right: 22,
            transform: 'translateY(-50%)',
            zIndex: 2,
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg,#FFFFFF,#E4E8EE)',
            boxShadow: '0 0 0 4px #0D0D10, 0 4px 12px rgba(127,230,214,.4)',
          }}
        >
          <ArrowRightLeft size={15} strokeWidth={2} color="#0A0A0C" />
        </button>

        {/* to (result) */}
        <div style={{ ...convField, marginTop: -4, border: '1px solid var(--accent)', boxShadow: '0 0 0 3px rgba(127,230,214,.1)', background: 'radial-gradient(120% 100% at 50% 0, rgba(127,230,214,.1), transparent 70%), #0E0E11' }}>
          <span className="mono" style={{ flex: 1, fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>≈ {formatAmount(result)}</span>
          <span className="mono" style={{ fontSize: 15, color: 'var(--accent)', fontWeight: 600 }}>{to}</span>
        </div>
      </div>

      <p className="mono" style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 16 }}>
        1 {ccy} = {fmtRate(oneUnitInUah)} UAH · онов. {ageLabel(cachedRate(ccy)?.fetchedAt ?? Date.now())}
      </p>
    </Sheet>
  )
}

const convField: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 14,
  background: '#0E0E11',
  border: '1px solid rgba(255,255,255,.08)',
}
