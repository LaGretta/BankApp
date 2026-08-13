import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// самохостовані шрифти (офлайн-PWA, без CDN)
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'

import './styles/tokens.css'
import './styles/global.css'

import App from './App'
import { registerUnauthorizedHandler } from './lib/apiClient'
import { forceLogout } from './store/authStore'
import { toast } from './store/toastStore'

// 401 → чистимо токен, показуємо повідомлення; редірект зробить ProtectedRoute
registerUnauthorizedHandler(() => {
  forceLogout()
  toast.error('Сесія завершилась. Увійдіть знову.')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
