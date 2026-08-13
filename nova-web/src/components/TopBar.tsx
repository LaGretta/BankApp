import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title?: string
  back?: boolean
  onBack?: () => void
  right?: ReactNode
  subtitle?: string
}

export function TopBar({ title, back, onBack, right, subtitle }: TopBarProps) {
  const navigate = useNavigate()
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 44,
        marginBottom: 18,
      }}
    >
      {back && (
        <button
          aria-label="Назад"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="control"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--r-field)',
            flexShrink: 0,
            color: 'var(--text-2)',
          }}
        >
          <span className="control-content">
            <ChevronLeft size={22} strokeWidth={1.9} />
          </span>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <h1 className="t-title" style={{ letterSpacing: '-0.01em' }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="t-caption text-3" style={{ marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </header>
  )
}
