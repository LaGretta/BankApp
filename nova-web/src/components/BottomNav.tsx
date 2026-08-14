import { ArrowLeftRight, LayoutGrid, Receipt, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Головна', icon: LayoutGrid },
  { to: '/savings', label: 'Накопичення', icon: Target },
  { to: '/transfer', label: 'Переказ', icon: ArrowLeftRight },
  { to: '/history', label: 'Історія', icon: Receipt },
]

export function BottomNav() {
  return (
    <nav
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'calc(var(--nav-h) + var(--safe-bottom))',
        paddingBottom: 'var(--safe-bottom)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 4,
        background: 'linear-gradient(180deg, rgba(8,8,10,.7), rgba(8,8,10,.96))',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: '1px solid var(--hairline)',
        zIndex: 40,
      }}
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} style={{ textDecoration: 'none', flex: 1 }}>
          {({ isActive }) => (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                padding: '4px 0',
              }}
            >
              <span
                className={isActive ? 'nav-active' : undefined}
                style={{
                  width: 46,
                  height: 34,
                  borderRadius: 'var(--r-nav)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 220ms cubic-bezier(.22,1,.36,1)',
                  color: isActive ? '#0A0A0C' : 'var(--text-3)',
                }}
              >
                <Icon size={21} strokeWidth={1.9} />
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                  transition: 'color 220ms ease-out',
                }}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
