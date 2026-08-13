import {
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useId,
  useState,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  suffix?: ReactNode
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, icon, suffix, type, style, ...rest },
  ref,
) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {label && (
        <label htmlFor={id} className="mono-cap" style={{ paddingLeft: 2 }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
          minHeight: 52,
          borderRadius: 'var(--r-field)',
          background: 'linear-gradient(160deg, #141417, #0e0e11)',
          border: `1px solid ${error ? 'var(--negative)' : 'var(--hairline)'}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
          transition: 'border-color 140ms ease-out',
        }}
      >
        {icon && <span style={{ color: 'var(--text-3)', display: 'inline-flex' }}>{icon}</span>}
        <input
          id={id}
          ref={ref}
          type={effectiveType}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-1)',
            fontSize: 15,
            fontFamily: rest.inputMode === 'numeric' || rest.inputMode === 'decimal' ? 'var(--font-mono)' : 'var(--font-ui)',
            ...style,
          }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={show ? 'Сховати' : 'Показати'}
            onClick={() => setShow((s) => !s)}
            style={{ color: 'var(--text-3)', display: 'inline-flex' }}
          >
            {show ? <EyeOff size={18} strokeWidth={1.9} /> : <Eye size={18} strokeWidth={1.9} />}
          </button>
        )}
        {suffix}
      </div>
      {error ? (
        <span className="t-caption" style={{ color: 'var(--negative)', paddingLeft: 2 }}>
          {error}
        </span>
      ) : hint ? (
        <span className="t-caption text-3" style={{ paddingLeft: 2 }}>
          {hint}
        </span>
      ) : null}
    </div>
  )
})
