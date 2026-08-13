import { AtSign, Info, Lock } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { NovaMark } from '../components/NovaMark'
import { ApiError } from '../lib/apiClient'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

export function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    clearSessionExpired()
    setBusy(true)
    try {
      const res = await login(email.trim(), password)
      setAuth(res)
      toast.success(`Вітаємо, ${res.firstName}!`)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 401
            ? 'Невірний email або пароль'
            : e.detail
          : 'Не вдалося увійти'
      setErr(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '82vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 34 }}>
        <NovaMark size={72} tile />
        <h1 className="t-display" style={{ marginTop: 20 }}>
          Nova
        </h1>
        <p className="t-body text-2" style={{ marginTop: 4 }}>
          Банк майбутнього
        </p>
      </div>

      {sessionExpired && (
        <div
          style={{
            marginTop: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 'var(--r-field)',
            background: 'var(--accent-soft)',
            border: '1px solid rgba(127,230,214,.3)',
          }}
        >
          <Info size={18} strokeWidth={1.9} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span className="t-label" style={{ color: 'var(--text-1)' }}>
            Сесія завершилась. Увійдіть знову.
          </span>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: sessionExpired ? 18 : 40 }}>
        <Field
          label="Email"
          type="email"
          placeholder="you@nova.bank"
          autoComplete="email"
          icon={<AtSign size={18} strokeWidth={1.9} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Пароль"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          icon={<Lock size={18} strokeWidth={1.9} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={err ?? undefined}
          required
        />
        <Button type="submit" fullWidth loading={busy} style={{ marginTop: 8 }}>
          Увійти
        </Button>
      </form>

      <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 28 }}>
        <span className="t-body text-2">Немає акаунта? </span>
        <Link to="/register" className="t-body" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Зареєструватися
        </Link>
      </div>
    </div>
  )
}
