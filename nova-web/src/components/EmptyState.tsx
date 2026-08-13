import type { ReactNode } from 'react'
import { Nova } from './Nova'

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 8,
        padding: '48px 24px',
      }}
    >
      <Nova state="empty" size={104} />
      <h3 className="t-title" style={{ marginTop: 8 }}>
        {title}
      </h3>
      {subtitle && (
        <p className="t-body text-2" style={{ maxWidth: 260, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {action && <div style={{ marginTop: 14, width: '100%', maxWidth: 280 }}>{action}</div>}
    </div>
  )
}
