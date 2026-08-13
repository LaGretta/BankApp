import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  dismissable?: boolean
}

/* Модальна нижня шторка (для reveal CVV, підтверджень). */
export function Sheet({ open, onClose, children, dismissable = true }: SheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <div
        onClick={dismissable ? onClose : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.62)',
          backdropFilter: 'blur(3px)',
          animation: 'fade-in 200ms ease-out',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'var(--app-max)',
          background: 'linear-gradient(180deg, #17171b, #0d0d10)',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          border: '1px solid var(--border)',
          borderBottom: 'none',
          boxShadow: 'var(--e3)',
          padding: '10px 20px calc(24px + var(--safe-bottom))',
          animation: 'sheet-up 320ms cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: 'var(--s3)',
            margin: '4px auto 18px',
          }}
        />
        {children}
      </div>
    </div>,
    document.body,
  )
}
