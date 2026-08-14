import { type CSSProperties, useEffect, useState } from 'react'

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const LINES = [20, 40, 60, 80]

interface LiquidJarProps {
  /** 0..100 */
  percent: number
  width: number
  height: number
  showLines?: boolean
  /** підписи % праворуч (20/40/60/80/100) — для екрана деталей */
  showLabels?: boolean
  /** легкий sparkle на 100% */
  celebrate?: boolean
  style?: CSSProperties
}

/*
  Refined liquid jar (NOVA_SAVINGS_HANDOFF §1–3).
  Graphite-silver fill; turquoise ЛИШЕ як тонкий меніск + lit fill-lines.
  Calm: рівень піднімається до нового значення і ЗАВМИРАЄ (без loop).
*/
export function LiquidJar({
  percent,
  width,
  height,
  showLines = true,
  showLabels = false,
  celebrate = false,
  style,
}: LiquidJarProps) {
  const target = Math.max(0, Math.min(100, percent))
  // рівень слідує за target напряму; CSS-transition на height сам анімує підйом
  // при поповненні (rise-then-rest). Без rAF — працює і у фонових вкладках.
  const [shown, setShown] = useState(target)
  useEffect(() => {
    setShown(target)
  }, [target])

  const full = target >= 100
  const showHalo = target >= 60
  const cornerR = Math.round(height * 0.12)

  const jar = (
    <div
      style={{
        position: 'relative',
        width,
        height,
        flexShrink: 0,
      }}
    >
      {/* halo (≥60%, breath) */}
      {showHalo && !prefersReduced && (
        <span
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '30%',
            background: `radial-gradient(circle, rgba(127,230,214,${full ? 0.18 : 0.12}), transparent 70%)`,
            animation: 'breath 3400ms ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* vessel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `24% 24% 30% 30% / ${cornerR}px ${cornerR}px ${cornerR + 6}px ${cornerR + 6}px`,
          background: 'rgba(255,255,255,.025)',
          border: '1px solid rgba(255,255,255,.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
          overflow: 'hidden',
        }}
      >
        {/* liquid */}
        <div
          style={{
            position: 'absolute',
            left: 4,
            right: 4,
            bottom: 4,
            height: `${shown}%`,
            background: 'linear-gradient(180deg, #5C6C74 0%, #2C373D 58%, #1F282D 100%)',
            borderRadius: '4px 4px 3px 3px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14), 0 0 10px rgba(127,230,214,.08)',
            transition: prefersReduced ? 'none' : 'height 700ms cubic-bezier(.22,1,.36,1)',
          }}
        >
          {/* meniscus — єдиний turquoise на заливці (на 100% пласкіший) */}
          {target > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `rgba(127,230,214,${full ? 0.4 : 0.55})`,
                boxShadow: full ? 'none' : '0 0 6px rgba(127,230,214,.4)',
              }}
            />
          )}
        </div>

        {/* fill-lines */}
        {showLines &&
          LINES.map((l) => (
            <span
              key={l}
              style={{
                position: 'absolute',
                left: 6,
                right: 6,
                bottom: `${l}%`,
                height: 1,
                background: target >= l ? 'rgba(127,230,214,.4)' : 'rgba(255,255,255,.05)',
                transition: 'background 240ms ease-out',
              }}
            />
          ))}

        {/* glass sheen (static) */}
        <span
          style={{
            position: 'absolute',
            top: 5,
            left: '14%',
            width: '13%',
            height: '64%',
            background: 'linear-gradient(180deg, rgba(255,255,255,.12), transparent 45%)',
            borderRadius: 6,
            pointerEvents: 'none',
          }}
        />

        {/* sparkle at 100% */}
        {full && celebrate && (
          <span
            style={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              transformOrigin: 'center',
              animation: 'sparkle 1600ms ease-in-out infinite',
              pointerEvents: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M12 3 L13.6 10.4 L21 12 L13.6 13.6 L12 21 L10.4 13.6 L3 12 L10.4 10.4 Z" fill="var(--accent)" />
            </svg>
          </span>
        )}
      </div>
    </div>
  )

  if (!showLabels) return <div style={style}>{jar}</div>

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, ...style }}>
      {jar}
      {/* % labels праворуч, вирівняні по лініях */}
      <div style={{ position: 'relative', width: 44, height }}>
        {[20, 40, 60, 80, 100].map((l) => (
          <span
            key={l}
            className="mono"
            style={{
              position: 'absolute',
              bottom: `calc(${l}% - 7px)`,
              left: 0,
              fontSize: 11,
              fontWeight: 600,
              color: target >= l ? 'var(--accent)' : 'var(--text-3)',
              transition: 'color 240ms ease-out',
            }}
          >
            {l}%
          </span>
        ))}
      </div>
    </div>
  )
}
