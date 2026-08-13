import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
  useState,
} from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  /** material = iridescent-матеріал (CTA). ghost = тихий варіант. */
  variant?: 'material' | 'ghost'
  /** активний стан (наприклад вибраний чіп/таб) — матеріал «увімкнено». */
  active?: boolean
  fullWidth?: boolean
  loading?: boolean
  size?: 'md' | 'lg'
}

/*
  Iridescent white material — ОДНЕ джерело. Ніде не хардкодимо градієнт.
  .control (rest) → :hover → :active/[data-on] (матеріал) + sheen(breath) + shimmer(aishimmer).
*/
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'material', active, fullWidth, loading, size = 'lg', disabled, style, className, ...rest },
  ref,
) {
  const [pressing, setPressing] = useState(false)

  const pad = size === 'lg' ? '15px 20px' : '11px 16px'
  const radius = 'var(--r-field)'
  const isGhost = variant === 'ghost'

  return (
    <button
      ref={ref}
      className={`control ${className ?? ''}`}
      data-on={active ? '' : undefined}
      data-pressing={pressing && !isGhost ? '' : undefined}
      disabled={disabled || loading}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      style={{
        padding: pad,
        borderRadius: radius,
        width: fullWidth ? '100%' : undefined,
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        minHeight: size === 'lg' ? 52 : 44,
        ...(isGhost
          ? { background: 'transparent', border: '1px solid var(--hairline)' }
          : null),
        ...style,
      }}
      {...rest}
    >
      {!isGhost && <span className="sheen" />}
      {!isGhost && <span className="shimmer" />}
      <span className="control-content">
        {loading ? (
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              display: 'inline-block',
              animation: 'spin 800ms linear infinite',
            }}
          />
        ) : (
          children
        )}
      </span>
    </button>
  )
})
