import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n'
import './style.css'
import { Toaster } from 'react-hot-toast'
import perfTracker from './utils/perfTracker'
import { ENABLE_PERFORMANCE_TRACKING } from './utils/featureFlags'

// Track initial load metrics when DOM is ready
if (ENABLE_PERFORMANCE_TRACKING) {
  if (document.readyState === 'complete') {
    perfTracker.trackPageLoad()
  } else {
    window.addEventListener('load', () => {
      perfTracker.trackPageLoad()
    })
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
)
