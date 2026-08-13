import { splitAmount, symbolForNum } from '../lib/format'
import type { CurrencyCode } from '../lib/enums'
import { CURRENCY_SYMBOL } from '../lib/enums'

interface AmountProps {
  value: number
  currency: CurrencyCode | number
  /** 'in' = дохід (+, може бути --positive), 'out' = списання (−), 'plain' = без знака */
  direction?: 'in' | 'out' | 'plain'
  size?: number
  positiveColor?: boolean
}

/* Суми: --text-1 з приглушеним символом валюти. Без гучного зеленого. */
export function Amount({ value, currency, direction = 'plain', size = 24, positiveColor }: AmountProps) {
  const symbol = typeof currency === 'number' ? symbolForNum(currency) : CURRENCY_SYMBOL[currency as CurrencyCode]
  const { int, frac } = splitAmount(value)
  const sign = direction === 'in' ? '+' : direction === 'out' ? '−' : ''
  const color = positiveColor && direction === 'in' ? 'var(--positive)' : 'var(--text-1)'

  return (
    <span
      className="mono"
      style={{
        fontWeight: 700,
        fontSize: size,
        color,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 1,
      }}
    >
      {sign && <span style={{ marginRight: 1 }}>{sign}</span>}
      <span>{int}</span>
      <span style={{ fontSize: size * 0.62, opacity: 0.8 }}>,{frac}</span>
      <span style={{ color: 'var(--text-3)', fontSize: size * 0.62, marginLeft: 4, fontWeight: 600 }}>
        {symbol}
      </span>
    </span>
  )
}
