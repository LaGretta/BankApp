import type { CSSProperties, ReactNode } from 'react'
import { Nova } from './Nova'

/* Повноекранні службові стани зі станами Nova. */
export function LoadingScreen({ label = 'Завантаження…' }: { label?: string }) {
  return (
    <div style={centered}>
      <Nova state="loading" size={92} />
      <p className="t-label text-3" style={{ marginTop: 14 }}>
        {label}
      </p>
    </div>
  )
}

export function ErrorScreen({
  message,
  action,
}: {
  message: string
  action?: ReactNode
}) {
  return (
    <div style={centered}>
      <Nova state="error" size={96} />
      <p className="t-body text-2" style={{ marginTop: 14, maxWidth: 280, textAlign: 'center' }}>
        {message}
      </p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

const centered: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '55vh',
  padding: 24,
}
