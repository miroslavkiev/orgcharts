import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n'
import './style.css'
import { Toaster } from 'react-hot-toast'
import perfTracker from './utils/perfTracker'

// Track initial load metrics when DOM is ready
if (document.readyState === 'complete') {
  perfTracker.trackPageLoad()
} else {
  window.addEventListener('load', () => {
    perfTracker.trackPageLoad()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
)
