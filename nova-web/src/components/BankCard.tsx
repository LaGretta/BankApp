import { Eye, EyeOff } from 'lucide-react'
import { type CSSProperties, useState } from 'react'
import { useLongPress } from '../hooks/useLongPress'
import { copyToClipboard } from '../lib/clipboard'
import type { CardTier } from '../lib/enums'
import { formatExpiry, groupCardNumber, maskCardNumber } from '../lib/format'

interface TierSkin {
  bg: string
  fg: string
  sub: string
  chip: string
  sheen?: string
  border: string
  shadow: string
}

const SKINS: Record<CardTier, TierSkin> = {
  White: {
    bg: 'radial-gradient(80% 60% at 30% 0%, rgba(150,238,226,.45), transparent 60%), linear-gradient(155deg,#FFFFFF,#E4E8EF)',
    fg: '#0A0A0C',
    sub: 'rgba(10,10,12,.6)',
    chip: 'linear-gradient(135deg,#D8B463,#F1DDA0)',
    border: 'rgba(255,255,255,.6)',
    shadow: '0 22px 48px rgba(127,230,214,.22), inset 0 1px 0 rgba(255,255,255,.9)',
  },
  Black: {
    bg: 'radial-gradient(90% 70% at 82% 8%, rgba(127,230,214,.14), transparent 55%), linear-gradient(155deg,#26262B,#0B0B0D)',
    fg: '#F4F5F7',
    sub: 'rgba(244,245,247,.55)',
    chip: 'linear-gradient(135deg,#8A8F9A,#C7CCD6)',
    border: 'rgba(255,255,255,.14)',
    shadow: '0 22px 48px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1)',
  },
  Platinum: {
    bg: 'radial-gradient(80% 60% at 25% 0%, rgba(255,255,255,.55), transparent 55%), linear-gradient(150deg,#CBD0DA,#9AA0AB 55%,#6E7480)',
    fg: '#15171C',
    sub: 'rgba(21,23,28,.6)',
    chip: 'linear-gradient(135deg,#B98F3E,#EBD8A6)',
    border: 'rgba(255,255,255,.5)',
    shadow: '0 22px 48px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.7)',
  },
}

interface BankCardProps {
  tier: CardTier
  number: string
  holderName: string
  expiryDate: string
  isActive?: boolean
  interactive?: boolean
  compact?: boolean
  style?: CSSProperties
}

export function BankCard({
  tier,
  number,
  holderName,
  expiryDate,
  isActive = true,
  interactive = true,
  compact = false,
  style,
}: BankCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [revealSeq, setRevealSeq] = useState(0) // ключ для перезапуску blur-анімації
  const skin = SKINS[tier]
  const blocked = !isActive
  const digitsOnly = number.replace(/\s+/g, '')

  const toggleReveal = () =>
    setRevealed((r) => {
      if (!r) setRevealSeq((s) => s + 1)
      return !r
    })
  const copyNumber = () => copyToClipboard(digitsOnly, 'Номер скопійовано')

  // tap → показати/сховати, утримання → скопіювати повний номер
  const { style: numGestureStyle, ...numGesture } = useLongPress({
    onTap: interactive ? toggleReveal : undefined,
    onLongPress: interactive ? copyNumber : undefined,
  })

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1.586 / 1',
        borderRadius: 'var(--r-card)',
        padding: compact ? 16 : 20,
        background: skin.bg,
        color: skin.fg,
        border: `1px solid ${skin.border}`,
        boxShadow: skin.shadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        filter: blocked ? 'grayscale(.7) brightness(.8)' : undefined,
        transition: 'filter 200ms ease-out',
        ...style,
      }}
    >
      {/* top row: wordmark + tier */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: '-0.02em',
          }}
        >
          Nova
        </span>
        <span
          className="mono-cap"
          style={{ color: skin.sub, fontSize: 9.5, letterSpacing: '0.16em' }}
        >
          {tier}
        </span>
      </div>

      {/* chip + contactless */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -6 }}>
        <span
          style={{
            width: 34,
            height: 26,
            borderRadius: 6,
            background: skin.chip,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 2px 3px rgba(255,255,255,.5)',
          }}
        />
        <Contactless color={skin.sub} />
        {blocked && (
          <span
            className="mono-cap"
            style={{
              marginLeft: 'auto',
              color: 'var(--negative)',
              border: '1px solid var(--negative)',
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 9,
            }}
          >
            Заблоковано
          </span>
        )}
      </div>

      {/* number — tap: показати/сховати · утримання: скопіювати */}
      <div
        {...(interactive ? numGesture : {})}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={
          interactive ? 'Номер картки. Торкніться, щоб показати; утримуйте, щоб скопіювати' : undefined
        }
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleReveal()
                }
              }
            : undefined
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 26,
          cursor: interactive ? 'pointer' : 'default',
          ...(interactive ? numGestureStyle : null),
        }}
      >
        <span
          key={revealSeq}
          className="num-card"
          style={{
            color: skin.fg,
            animation: revealed ? 'card-reveal 320ms ease-out' : 'none',
          }}
        >
          {revealed ? groupCardNumber(number) : maskCardNumber(number)}
        </span>
        {interactive && (
          <span style={{ marginLeft: 'auto', opacity: 0.6, display: 'inline-flex', flexShrink: 0 }}>
            {revealed ? <EyeOff size={15} strokeWidth={1.9} /> : <Eye size={15} strokeWidth={1.9} />}
          </span>
        )}
      </div>

      {/* bottom: holder + expiry */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="mono-cap" style={{ color: skin.sub, fontSize: 8.5 }}>
            Власник
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {holderName || '—'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
          <span className="mono-cap" style={{ color: skin.sub, fontSize: 8.5 }}>
            Термін
          </span>
          <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
            {formatExpiry(expiryDate)}
          </span>
        </div>
      </div>
    </div>
  )
}

function Contactless({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
      <path d="M8 8a6 6 0 0 1 0 8" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M11.5 5.5a10 10 0 0 1 0 13" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M15 3a13.5 13.5 0 0 1 0 18" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}
