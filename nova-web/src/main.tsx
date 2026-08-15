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
import { registerAuthHandlers } from './lib/apiClient'
import { useAuthStore } from './store/authStore'

// Зв'язуємо apiClient зі стором:
// - getRefreshToken: звідки взяти поточний refresh-токен для /auth/refresh;
// - onTokensRefreshed: зберегти НОВІ token+refreshToken (ротація) після silent-refresh;
// - onRefreshFailed: refresh протух/відкликаний → очистити сесію + банер, редірект робить ProtectedRoute.
registerAuthHandlers({
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokensRefreshed: (t) => useAuthStore.getState().updateTokens(t),
  onRefreshFailed: () => useAuthStore.getState().expireSession(),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
