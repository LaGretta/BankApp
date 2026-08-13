import { createPortal } from 'react-dom'
import { Nova } from './Nova'
import { Button } from './Button'

/* Момент успіху: Nova pop + ring pulse (motion-спека §6). */
export function SuccessOverlay({
  title,
  subtitle,
  onDone,
}: {
  title: string
  subtitle?: string
  onDone: () => void
}) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--app-max)',
          background: 'linear-gradient(178deg,#131210,#0A0A0C)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          animation: 'fade-in 220ms ease-out',
        }}
      >
        <Nova state="success" size={128} />
        <h2 className="t-h1" style={{ marginTop: 28, textAlign: 'center' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="t-body text-2" style={{ marginTop: 8, textAlign: 'center', maxWidth: 280 }}>
            {subtitle}
          </p>
        )}
        <Button onClick={onDone} fullWidth style={{ marginTop: 36, maxWidth: 280 }}>
          Готово
        </Button>
      </div>
    </div>,
    document.body,
  )
}
