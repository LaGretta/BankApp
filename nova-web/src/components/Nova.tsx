import { type CSSProperties, useMemo } from 'react'

export type NovaState = 'success' | 'empty' | 'error' | 'loading' | 'pull'
export type PullPhase = 'pull' | 'release' | 'refreshing' | 'complete'

interface NovaProps {
  state: NovaState
  size?: number
  /** для state="pull": 0..1+ наскільки відтягнуто */
  pullProgress?: number
  pullPhase?: PullPhase
}

/*
  Один компонент маскота. Геометричний coin-orb: радіальний білий→#D2DAEA,
  очі та усмішка #3A4358. Пози керуються станом (див. таблицю в NOVA_HANDOFF §7).
*/
export function Nova({ state, size = 96, pullProgress = 0, pullPhase = 'pull' }: NovaProps) {
  const orbStyle = useMemo<CSSProperties>(() => {
    switch (state) {
      case 'success':
        return { animation: 'nova-pop 600ms cubic-bezier(.34,1.56,.64,1)' }
      case 'empty':
        return { animation: 'nova-float 3400ms ease-in-out infinite', transform: 'rotate(-8deg)' }
      case 'error':
        return { animation: 'nova-shake 500ms ease-in-out 2' }
      case 'loading':
        return { animation: 'nova-float 2000ms ease-in-out infinite' }
      case 'pull':
        return pullStyle(pullProgress, pullPhase)
    }
  }, [state, pullProgress, pullPhase])

  const desaturate = state === 'empty'
  const worried = state === 'error'

  const bodyId = 'novaBody'
  const refreshing = state === 'loading' || (state === 'pull' && pullPhase === 'refreshing')
  const showRings = state === 'success' || (state === 'pull' && pullPhase === 'complete')
  const showSpark = state === 'success' || (state === 'pull' && pullPhase === 'complete')

  return (
    <div
      style={{ width: size, height: size, position: 'relative', display: 'inline-block' }}
      aria-hidden
    >
      {/* success / complete — ring pulses */}
      {showRings && (
        <>
          <span style={ringStyle(0)} />
          <span style={ringStyle(220)} />
        </>
      )}

      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        style={{ ...orbStyle, position: 'relative', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={bodyId} cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor={desaturate ? '#DCDEE6' : '#E4E9F2'} />
            <stop offset="100%" stopColor={desaturate ? '#AEB2BF' : '#C6CEDE'} />
          </radialGradient>
          <radialGradient id="novaShade" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="rgba(40,60,80,.35)" />
            <stop offset="60%" stopColor="rgba(40,60,80,0)" />
          </radialGradient>
        </defs>

        {/* error halo */}
        {worried && (
          <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(224,128,143,.5)" strokeWidth="6" />
        )}

        {/* orbit ring — loading / refreshing */}
        {refreshing && (
          <g style={{ transformOrigin: '60px 60px', animation: 'spin 1000ms linear infinite' }}>
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="30 250"
              opacity="0.9"
            />
          </g>
        )}

        {/* orb body */}
        <circle cx="60" cy="60" r="38" fill={`url(#${bodyId})`} />
        <circle cx="60" cy="60" r="38" fill="url(#novaShade)" />
        <ellipse cx="48" cy="44" rx="13" ry="9" fill="rgba(255,255,255,.65)" />

        {/* brows — only when worried */}
        {worried && (
          <>
            <line x1="42" y1="49" x2="53" y2="53" stroke="#3A4358" strokeWidth="3" strokeLinecap="round" />
            <line x1="78" y1="49" x2="67" y2="53" stroke="#3A4358" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* eyes */}
        <g fill="#3A4358" style={refreshing ? { animation: 'nova-blink 1000ms ease-in-out infinite' } : undefined}>
          <ellipse cx="49" cy="60" rx="4.4" ry={worried ? 5.2 : 5.6} />
          <ellipse cx="71" cy="60" rx="4.4" ry={worried ? 5.2 : 5.6} />
        </g>

        {/* mouth */}
        {mouth(state, pullPhase)}

        {/* spark */}
        {showSpark && (
          <g style={{ transformOrigin: '92px 30px', animation: 'sparkle 1600ms ease-in-out infinite' }}>
            <path d="M92 22 L94 29 L101 30 L94 31 L92 38 L90 31 L83 30 L90 29 Z" fill="var(--accent)" />
          </g>
        )}
      </svg>
    </div>
  )
}

function mouth(state: NovaState, phase: PullPhase) {
  const stroke = '#3A4358'
  if (state === 'error') {
    // o-mouth (worried)
    return <circle cx="60" cy="78" r="5" fill="none" stroke={stroke} strokeWidth="3" />
  }
  if (state === 'empty') {
    // flat
    return <line x1="52" y1="78" x2="68" y2="78" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
  }
  if (state === 'success' || (state === 'pull' && phase === 'complete')) {
    // big smile
    return <path d="M48 74 Q60 88 72 74" fill="none" stroke={stroke} strokeWidth="3.4" strokeLinecap="round" />
  }
  // neutral-happy default
  return <path d="M50 76 Q60 84 70 76" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
}

function pullStyle(progress: number, phase: PullPhase): CSSProperties {
  if (phase === 'release') {
    return { animation: 'nova-pop 500ms cubic-bezier(.34,1.56,.64,1)' }
  }
  if (phase === 'refreshing') {
    return { animation: 'nova-float 1400ms ease-in-out infinite' }
  }
  if (phase === 'complete') {
    return { animation: 'nova-pop 500ms cubic-bezier(.34,1.56,.64,1)' }
  }
  // pull — стискаємо/розтягуємо за жестом
  const p = Math.min(1.2, Math.max(0, progress))
  const sy = 1 + p * 0.18
  const sx = 1 - p * 0.08
  return { transform: `scaleY(${sy}) scaleX(${sx})`, transformOrigin: '60px 100px' }
}

function ringStyle(delay: number): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid var(--accent)',
    animation: `ring 1800ms ease-out ${delay}ms`,
    pointerEvents: 'none',
  }
}
