import { Copy, Loader2 } from 'lucide-react'
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { getCardCvv } from '../api/cards'
import { useCountUp } from '../hooks/useCountUp'
import { useLongPress } from '../hooks/useLongPress'
import { useTilt } from '../hooks/useTilt'
import { ApiError } from '../lib/apiClient'
import type { CardTier, CurrencyCode } from '../lib/enums'
import { formatExpiry, groupCardNumber, last4, pseudoIban, splitAmount, symbolFor } from '../lib/format'
import { copyToClipboard } from '../lib/clipboard'
import { toast } from '../store/toastStore'

const FLAG_SRC: Record<CurrencyCode, string> = {
  UAH: '/flags/ua.svg',
  USD: '/flags/us.svg',
  EUR: '/flags/eu.svg',
}

interface Skin {
  body: string
  fg: string
  sub: string
  badgeBorder: string
  badgeColor: string
  carbon: string
  glow: string
  chip: string
}

const SKINS: Record<CardTier, Skin> = {
  Black: {
    body: 'linear-gradient(150deg, #2A2A32, #0B0B0E)',
    fg: '#F4F5F7',
    sub: '#8A8D96',
    badgeBorder: 'rgba(255,255,255,.22)',
    badgeColor: '#D4D4DA',
    carbon: 'rgba(255,255,255,.028)',
    glow: 'radial-gradient(240px 130px at 82% -12%, rgba(127,230,214,.16), transparent 62%)',
    chip: 'linear-gradient(135deg,#E7D08A,#C6A24E)',
  },
  White: {
    body: 'linear-gradient(150deg, #FCFCFF, #E2E6EE)',
    fg: '#0A0A0C',
    sub: 'rgba(10,10,12,.55)',
    badgeBorder: 'rgba(0,0,0,.18)',
    badgeColor: '#3A3A40',
    carbon: 'rgba(0,0,0,.035)',
    glow: 'radial-gradient(240px 130px at 82% -12%, rgba(127,230,214,.28), transparent 62%)',
    chip: 'linear-gradient(135deg,#E7D08A,#C6A24E)',
  },
  Platinum: {
    body: 'linear-gradient(150deg, #CBD0DA, #9AA0AB 55%, #6E7480)',
    fg: '#15171C',
    sub: 'rgba(21,23,28,.55)',
    badgeBorder: 'rgba(255,255,255,.5)',
    badgeColor: '#2A2C31',
    carbon: 'rgba(255,255,255,.05)',
    glow: 'radial-gradient(240px 130px at 82% -12%, rgba(255,255,255,.4), transparent 62%)',
    chip: 'linear-gradient(135deg,#EBD8A6,#B98F3E)',
  },
}

export interface FlipCardProps {
  tier: CardTier
  number: string
  holderName: string
  expiryDate: string
  isActive: boolean
  balance: number
  currency: CurrencyCode
  accountId: number
  cardId: number
  primary?: boolean
  flipped: boolean
  onFlip: () => void
}

const W = 330
const H = 208

export function FlipCard(props: FlipCardProps) {
  const { tier, balance, currency, isActive, flipped, onFlip } = props
  const skin = SKINS[tier] ?? SKINS.Black
  const { tilt, onPointerMove, onPointerLeave, reduced } = useTilt(7)

  // анімація фліпу (щоб розвести з демпфуванням нахилу)
  const [flipping, setFlipping] = useState(false)
  const prev = useRef(flipped)
  useEffect(() => {
    if (prev.current !== flipped) {
      prev.current = flipped
      if (!reduced) {
        setFlipping(true)
        const t = setTimeout(() => setFlipping(false), 540)
        return () => clearTimeout(t)
      }
    }
  }, [flipped, reduced])

  const wrapperTransform = reduced
    ? undefined
    : `rotateX(${flipping ? 0 : tilt.x}deg) rotateY(${(flipped ? 180 : 0) + (flipping ? 0 : tilt.y)}deg)`

  return (
    <div
      style={{ width: W, height: H, perspective: 1300, flexShrink: 0 }}
      onPointerMove={reduced ? undefined : onPointerMove}
      onPointerLeave={reduced ? undefined : onPointerLeave}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: reduced ? undefined : 'preserve-3d',
          transform: wrapperTransform,
          transition: reduced
            ? undefined
            : flipping
              ? 'transform 520ms cubic-bezier(.4,0,.2,1)'
              : 'transform 140ms ease-out',
        }}
      >
        <Front {...props} skin={skin} balance={balance} currency={currency} flipping={flipping} reduced={reduced} onFlip={onFlip} />
        <Back {...props} skin={skin} flipping={flipping} reduced={reduced} onFlip={onFlip} />
      </div>
      {/* заблокована — легкий оверлей поверх усього */}
      {!isActive && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 5,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--negative)',
            border: '1px solid var(--negative)',
            borderRadius: 999,
            padding: '2px 8px',
            background: 'rgba(10,10,12,.5)',
            backdropFilter: 'blur(4px)',
          }}
        >
          Заблоковано
        </span>
      )}
    </div>
  )
}

/* ---------------------------- overlays ---------------------------- */
function Overlays({ skin, front, flipping }: { skin: Skin; front?: boolean; flipping: boolean }) {
  return (
    <>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(115deg, ${skin.carbon} 0 1px, transparent 1px 4px)`,
        }}
      />
      {front && <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: skin.glow }} />}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(115deg, transparent 40%, rgba(127,230,214,.10) 50%, transparent 60%)',
        }}
      />
      {flipping && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '45%',
            pointerEvents: 'none',
            background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.7), transparent)',
            animation: 'flip-sheen 520ms ease-out',
          }}
        />
      )}
    </>
  )
}

const faceBase: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 18,
  overflow: 'hidden',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.04)',
}

/* ------------------------------ FRONT ------------------------------ */
function Front(
  props: FlipCardProps & { skin: Skin; flipping: boolean; reduced: boolean },
) {
  const { skin, number, tier, balance, currency, flipping, reduced, flipped, onFlip } = props
  const animated = useCountUp(balance)
  const { int, frac } = splitAmount(animated)
  const symbol = symbolFor(currency)

  const visibility: CSSProperties = reduced
    ? { opacity: flipped ? 0 : 1, transition: 'opacity 280ms ease-out', pointerEvents: flipped ? 'none' : 'auto' }
    : {}

  return (
    <div
      onClick={onFlip}
      style={{
        ...faceBase,
        background: skin.body,
        color: skin.fg,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: `${faceBase.boxShadow}, 0 30px 60px rgba(0,0,0,.6)`,
        ...visibility,
      }}
    >
      <Overlays skin={skin} front flipping={flipping} />

      {/* top */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 17, letterSpacing: '0.08em' }}>Nova</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 9,
            lineHeight: 1,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '4px 11px',
            border: `1px solid ${skin.badgeBorder}`,
            borderRadius: 999,
            color: skin.badgeColor,
          }}
        >
          {tier}
        </span>
      </div>

      {/* middle — balance */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: skin.sub,
            marginBottom: 4,
          }}
        >
          Баланс
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em' }}>
            {int}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: skin.sub, marginLeft: 2 }}>
            .{frac} {symbol}
          </span>
        </div>
      </div>

      {/* bottom — chip + masked, mastercard */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 34,
              height: 26,
              borderRadius: 6,
              background: skin.chip,
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,.6), inset 0 -2px 4px rgba(0,0,0,.2)',
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.1em', color: skin.sub }}>
            •••• {last4(number)}
          </span>
        </div>
        <Mastercard />
      </div>
    </div>
  )
}

function Mastercard() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#EB001B' }} />
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#F79E1B', marginLeft: -9, mixBlendMode: 'hard-light' }} />
    </span>
  )
}

/* ------------------------------ BACK ------------------------------ */
function Back(props: FlipCardProps & { skin: Skin; flipping: boolean; reduced: boolean }) {
  const { skin, number, expiryDate, currency, accountId, cardId, primary, flipping, reduced, flipped, onFlip } = props

  // reveal + copy повного номера
  const [revealed, setRevealed] = useState(false)
  const [revealSeq, setRevealSeq] = useState(0)
  const digitsOnly = number.replace(/\s+/g, '')
  const numGesture = useLongPress({
    onTap: () => setRevealed((r) => {
      if (!r) setRevealSeq((s) => s + 1)
      return !r
    }),
    onLongPress: () => copyToClipboard(digitsOnly, 'Номер скопійовано'),
  })
  const { style: numStyle, ...numHandlers } = numGesture

  // CVV — тягнемо лише на вимогу
  const [cvv, setCvv] = useState<string | null>(null)
  const [cvvShown, setCvvShown] = useState(false)
  const [cvvLoading, setCvvLoading] = useState(false)
  const [cvvSeq, setCvvSeq] = useState(0)

  async function toggleCvv() {
    if (cvvShown) {
      setCvvShown(false)
      return
    }
    if (cvv) {
      setCvvShown(true)
      setCvvSeq((s) => s + 1)
      return
    }
    setCvvLoading(true)
    try {
      const r = await getCardCvv(cardId)
      setCvv(r.cvv)
      setCvvShown(true)
      setCvvSeq((s) => s + 1)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : 'Не вдалося отримати CVV')
    } finally {
      setCvvLoading(false)
    }
  }
  const cvvGesture = useLongPress({
    onTap: toggleCvv,
    onLongPress: () => cvv && copyToClipboard(cvv, 'CVV скопійовано'),
  })
  const { style: cvvStyle, ...cvvHandlers } = cvvGesture

  const stop = (e: ReactMouseEvent | ReactPointerEvent) => e.stopPropagation()

  const visibility: CSSProperties = reduced
    ? { opacity: flipped ? 1 : 0, transition: 'opacity 280ms ease-out', pointerEvents: flipped ? 'auto' : 'none' }
    : {}

  return (
    <div
      onClick={onFlip}
      style={{
        ...faceBase,
        background: skin.body,
        color: skin.fg,
        transform: reduced ? undefined : 'rotateY(180deg)',
        cursor: 'pointer',
        boxShadow: `${faceBase.boxShadow}, 0 30px 60px rgba(0,0,0,.6)`,
        ...visibility,
      }}
    >
      <Overlays skin={skin} flipping={flipping} />

      {/* magnetic stripe */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 0,
          right: 0,
          height: 42,
          background: 'linear-gradient(180deg,#050506,#0C0C0E)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), inset 0 -1px 0 rgba(0,0,0,.7)',
        }}
      />

      {/* content */}
      <div style={{ position: 'absolute', top: 72, left: 0, right: 0, padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {/* signature + CVV */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 28,
              borderRadius: 5,
              background: 'repeating-linear-gradient(90deg,#E9EAEE 0 6px,#DCDEE4 6px 12px)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)',
                fontStyle: 'italic',
                fontSize: 12,
                color: '#3A3B40',
              }}
            >
              {signature(props.holderName)}
            </span>
          </div>
          {/* CVV box — тап показує (запит на бекенд), утримання копіює */}
          <div
            {...cvvHandlers}
            onClick={stop}
            role="button"
            aria-label="CVV: торкніться щоб показати, утримуйте щоб скопіювати"
            style={{
              width: 58,
              height: 28,
              borderRadius: 5,
              background: '#EDEEF1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              ...cvvStyle,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', color: '#8A8D96' }}>CVV</span>
            <span
              key={cvvSeq}
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 12,
                color: '#17171C',
                animation: cvvShown ? 'card-reveal 320ms ease-out' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {cvvLoading ? (
                <Loader2 size={11} strokeWidth={2.2} style={{ animation: 'spin 800ms linear infinite' }} />
              ) : cvvShown && cvv ? (
                cvv
              ) : (
                '•••'
              )}
            </span>
          </div>
        </div>

        {/* full number + expiry + copy */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            {...numHandlers}
            onClick={stop}
            role="button"
            aria-label="Номер картки: торкніться щоб показати, утримуйте щоб скопіювати"
            key={revealSeq}
            className="mono"
            style={{
              fontSize: 14,
              letterSpacing: '0.1em',
              color: skin.fg,
              cursor: 'pointer',
              animation: revealed ? 'card-reveal 320ms ease-out' : 'none',
              ...numStyle,
            }}
          >
            {revealed ? groupCardNumber(number) : `•••• •••• •••• ${last4(number)}`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: skin.sub }}>{formatExpiry(expiryDate)}</span>
            <button onClick={(e) => { stop(e); copyToClipboard(digitsOnly, 'Номер скопійовано') }} aria-label="Скопіювати номер" style={{ display: 'inline-flex' }}>
              <Copy size={14} strokeWidth={1.9} color="var(--accent)" />
            </button>
          </div>
        </div>

        {/* account strip + holo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <img src={FLAG_SRC[currency]} width={15} height={15} alt={currency} style={{ borderRadius: '50%' }} />
            <span style={{ fontSize: 11, color: '#C4C7D0' }}>
              {currency} · {primary ? 'Основний' : 'Рахунок'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#7c7f87' }}>· {pseudoIban(accountId)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 30,
                height: 21,
                borderRadius: 4,
                opacity: 0.7,
                background: 'conic-gradient(from 210deg,#7FE6D6,#C9B8FF,#8FD8E6,#7FE6D6)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.3)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: '#D4D4DA' }}>NOVA</span>
          </span>
        </div>

        {/* legal microprint */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, lineHeight: 1.4, color: '#7a7d85' }}>
          Власність Nova Bank · обслуговування за умовами договору · 0 800 000 000
        </span>
      </div>
    </div>
  )
}

function signature(holder: string): string {
  const parts = (holder || 'Nova Client').trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`
  return parts[0]
}
