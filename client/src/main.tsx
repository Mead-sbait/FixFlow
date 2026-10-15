import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import { store } from './app/store'
import { I18nProvider } from './i18n/I18nProvider'
import './styles.css'

// Only the isolated UI-test dev server exposes this hook; production never does.
if (import.meta.env.DEV && import.meta.env.VITE_E2E_UI_ONLY === '1') {
  (window as Window & { __FIXFLOW_TEST_STORE__?: typeof store }).__FIXFLOW_TEST_STORE__ = store
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </Provider>
  </StrictMode>
)
