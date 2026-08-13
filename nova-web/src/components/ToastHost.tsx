import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

const ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}
const COLOR = {
  success: 'var(--positive)',
  error: 'var(--negative)',
  info: 'var(--accent)',
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--safe-top) + 12px)',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 1000,
        pointerEvents: 'none',
        padding: '0 16px',
      }}
    >
      {toasts.map((t) => {
        const Icon = ICON[t.kind]
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: 420,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--r-field)',
              background: 'linear-gradient(160deg, #1a1a1f, #101013)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--e3)',
              animation: 'toast-in 260ms cubic-bezier(.22,1,.36,1)',
              cursor: 'pointer',
            }}
          >
            <Icon size={19} strokeWidth={1.9} color={COLOR[t.kind]} style={{ flexShrink: 0 }} />
            <span className="t-label" style={{ color: 'var(--text-1)', lineHeight: 1.35 }}>
              {t.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
