import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ToastHost } from './components/ToastHost'
import { useAuthStore } from './store/authStore'

import { Login } from './screens/Login'
import { Register } from './screens/Register'
import { Dashboard } from './screens/Dashboard'
import { Accounts } from './screens/Accounts'
import { AccountDetail } from './screens/AccountDetail'
import { CardDetail } from './screens/CardDetail'
import { CreateCard } from './screens/CreateCard'
import { Transfer } from './screens/Transfer'
import { TopUp } from './screens/TopUp'
import { History } from './screens/History'
import { TransactionDetail } from './screens/TransactionDetail'
import { Savings } from './screens/Savings'
import { CreateJar } from './screens/CreateJar'
import { JarDetail } from './screens/JarDetail'
import { CardLimit } from './screens/CardLimit'
import type { JSX } from 'react'

function Protected({ children, nav = true }: { children: JSX.Element; nav?: boolean }) {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  if (!isAuthed) return <Navigate to="/login" replace />
  return <AppLayout nav={nav}>{children}</AppLayout>
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  if (isAuthed) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/accounts" element={<Protected><Accounts /></Protected>} />
        <Route path="/accounts/:id" element={<Protected nav={false}><AccountDetail /></Protected>} />
        <Route path="/cards/:id" element={<Protected nav={false}><CardDetail /></Protected>} />
        <Route path="/cards/:id/limit" element={<Protected nav={false}><CardLimit /></Protected>} />
        <Route path="/cards/new" element={<Protected nav={false}><CreateCard /></Protected>} />
        <Route path="/transfer" element={<Protected><Transfer /></Protected>} />
        <Route path="/topup" element={<Protected nav={false}><TopUp /></Protected>} />
        <Route path="/history" element={<Protected><History /></Protected>} />
        <Route path="/transactions/:id" element={<Protected nav={false}><TransactionDetail /></Protected>} />

        <Route path="/savings" element={<Protected><Savings /></Protected>} />
        <Route path="/jars/new" element={<Protected nav={false}><CreateJar /></Protected>} />
        <Route path="/jars/:id" element={<Protected nav={false}><JarDetail /></Protected>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastHost />
    </div>
  )
}
