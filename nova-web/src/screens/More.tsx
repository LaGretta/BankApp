import { BarChart3, ChevronRight, LineChart, LogOut, Receipt, Shield, Sparkles, User, Wallet, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initials } from '../lib/format'
import { cachedRate, fetchRate } from '../lib/rates'
import { useAuthStore } from '../store/authStore'

export function More() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logoutAsync = useAuthStore((s) => s.logoutAsync)

  const [rates, setRates] = useState<{ usd?: number; eur?: number }>({
    usd: cachedRate('USD')?.rate,
    eur: cachedRate('EUR')?.rate,
  })
  useEffect(() => {
    let alive = true
    Promise.all([fetchRate('USD'), fetchRate('EUR')])
      .then(([u, e]) => alive && setRates({ usd: u.rate, eur: e.rate }))
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : 'Nova'
  const ratesSub = rates.usd && rates.eur ? `USD ${rates.usd.toFixed(2)} · EUR ${rates.eur.toFixed(2)}` : 'USD · EUR'

  return (
    <div>
      <TopSpacer />

      {/* identity hero */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          padding: '24px 20px',
          background: 'radial-gradient(150% 120% at 85% -20%, rgba(127,230,214,.14), transparent 60%), linear-gradient(160deg,#1C1C22,#0E0E12)',
          border: '1px solid rgba(255,255,255,.09)',
          boxShadow: '0 14px 34px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)',
        }}
      >
        <span style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,230,214,.4), transparent 60%)', filter: 'blur(6px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, padding: 2, background: 'conic-gradient(from 200deg,#7FE6D6,#5C6C74,#C4CDD4,#7FE6D6)', flexShrink: 0 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 18, background: '#141417', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 22, color: 'var(--text-1)' }}>{initials(user?.firstName ?? 'N', user?.lastName ?? 'A')}</span>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 19, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            <span className="mono" style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid rgba(127,230,214,.25)', borderRadius: 999, padding: '3px 10px' }}>Клієнт Nova</span>
          </div>
        </div>
      </div>

      {/* group 1 */}
      <Group>
        <Entry icon={User} label="Профіль" hint="Особисті дані" placeholder first />
        <Entry icon={BarChart3} label="Аналітика" hint="Витрати та надходження" onClick={() => navigate('/analytics')} />
        <Entry icon={LineChart} label="Курси валют" hint={ratesSub} onClick={() => navigate('/rates')} />
      </Group>

      {/* group 2 */}
      <Group>
        <Entry icon={Wallet} label="Рахунки" onClick={() => navigate('/accounts')} first />
        <Entry icon={Receipt} label="Уся історія" onClick={() => navigate('/history')} />
      </Group>

      {/* group 3 */}
      <Group>
        <Entry icon={Settings} label="Налаштування" placeholder first />
        <Entry icon={Shield} label="Безпека" hint="Face ID · PIN" trailing={<span className="t-caption" style={{ color: 'var(--pos)' }}>Увімк.</span>} placeholder />
      </Group>

      {/* logout */}
      <button
        onClick={() => void logoutAsync()}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', marginTop: 18, padding: '15px', borderRadius: 'var(--r-field)', background: 'rgba(232,136,126,.06)', border: '1px solid rgba(232,136,126,.22)', color: '#E8887E', fontWeight: 600, fontSize: 15 }}
      >
        <LogOut size={18} strokeWidth={1.9} /> Вийти
      </button>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22, color: 'var(--footer-dim)' }}>
        <Sparkles size={12} strokeWidth={1.9} />
        <span style={{ fontSize: 11 }}>Nova · v2.4.0 — bank of the future</span>
      </div>
    </div>
  )
}

function TopSpacer() {
  return <div style={{ height: 8 }} />
}

function Group({ children }: { children: ReactNode }) {
  return <div className="surface" style={{ padding: '2px 16px', marginTop: 12 }}>{children}</div>
}

function Entry({
  icon: Icon,
  label,
  hint,
  onClick,
  trailing,
  placeholder,
  first,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  onClick?: () => void
  trailing?: ReactNode
  placeholder?: boolean
  first?: boolean
}) {
  return (
    <>
      {!first && <div className="hairline-top" style={{ marginLeft: 50 }} />}
      <button
        onClick={onClick}
        disabled={!onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '14px 0', cursor: onClick ? 'pointer' : 'default', opacity: placeholder ? 0.6 : 1 }}
      >
        <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#1a1a1f,#131316)', border: '1px solid var(--hairline)', color: 'var(--text-2)' }}>
          <Icon size={18} strokeWidth={1.9} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-label" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{label}</div>
          {hint && <div className="t-caption text-3" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hint}</div>}
        </div>
        {trailing ?? (placeholder ? <span className="t-caption text-3">Скоро</span> : <ChevronRight size={18} strokeWidth={1.9} color="var(--text-3)" />)}
      </button>
    </>
  )
}
