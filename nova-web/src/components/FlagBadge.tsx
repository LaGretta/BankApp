import type { CurrencyCode } from '../lib/enums'

const FLAG_SRC: Record<CurrencyCode, string> = {
  UAH: '/flags/ua.svg',
  USD: '/flags/us.svg',
  EUR: '/flags/eu.svg',
}

interface FlagBadgeProps {
  currency: CurrencyCode
  size?: number
}

/* Нейтральне коло тримає маленький центрований прапор (з padding, не розтягнутий). */
export function FlagBadge({ currency, size = 38 }: FlagBadgeProps) {
  const flag = Math.round(size * 0.58)
  return (
    <span
      className="flag-badge"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(160deg, #1C1C21, #141417)',
        border: '1px solid rgba(255,255,255,.09)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={FLAG_SRC[currency]}
        alt={currency}
        width={flag}
        height={flag}
        style={{ display: 'block', borderRadius: '50%', objectFit: 'cover' }}
      />
    </span>
  )
}
